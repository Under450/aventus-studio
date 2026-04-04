import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { validateOrigin } from '@/lib/csrf'
import { enhanceAndGeneratePost } from '@/lib/gemini'
import { validateTopic } from '@/lib/validation'
import { checkAndIncrement } from '@/lib/api-usage'

export async function POST(request: Request) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { workspace_id, topic, platform, tone } = body

  if (!workspace_id || typeof workspace_id !== 'string') {
    return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 })
  }

  // Fetch workspace (only safe columns, NOT tokens)
  const { data: workspace, error: wsError } = await supabase
    .from('workspaces')
    .select('id, niche, creator_voice')
    .eq('id', workspace_id)
    .is('deleted_at', null)
    .single()

  if (wsError || !workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  // Rate limit check
  const usage = await checkAndIncrement('gemini_text', workspace_id)
  if (!usage.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', remaining: usage.remaining },
      { status: 429 }
    )
  }

  const service = createServiceClient()
  const cleanTopic = topic ? validateTopic(topic) : ''
  const postPlatform = platform || 'instagram'
  const postTone = tone || ''

  try {
    const generated = await enhanceAndGeneratePost(
      postPlatform,
      cleanTopic,
      postTone,
      workspace.creator_voice
    )

    // Insert single post
    const { data: post, error: postError } = await service
      .from('posts')
      .insert({
        workspace_id,
        platform: postPlatform,
        caption: generated.caption || '',
        hashtags: Array.isArray(generated.hashtags) ? generated.hashtags : [],
        media_type: 'image' as const,
        status: 'draft' as const,
        ai_generated: true,
        ai_prompt: generated.image_prompt,
      })
      .select('id')
      .single()

    if (postError || !post) {
      throw new Error(postError?.message || 'Failed to insert post')
    }

    // Insert post_media row (image pending — generated on demand)
    await service.from('post_media').insert({
      post_id: post.id,
      media_type: 'image' as const,
      position: 0,
      ai_image_prompt: generated.image_prompt || null,
      image_status: 'pending' as const,
    })

    return NextResponse.json({
      post_id: post.id,
      caption: generated.caption,
      hashtags: generated.hashtags,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
