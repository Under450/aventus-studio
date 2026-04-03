import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateOrigin } from '@/lib/csrf'
import { regenerateCaption } from '@/lib/gemini'
import { checkAndIncrement } from '@/lib/api-usage'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Fetch post
  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('id, platform, caption, workspace_id')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (postError || !post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  // Fetch workspace
  const { data: workspace, error: wsError } = await supabase
    .from('workspaces')
    .select('niche, creator_voice')
    .eq('id', post.workspace_id)
    .is('deleted_at', null)
    .single()

  if (wsError || !workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  // Rate limit check
  const usage = await checkAndIncrement('gemini_text', post.workspace_id)
  if (!usage.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', remaining: usage.remaining },
      { status: 429 }
    )
  }

  try {
    const result = await regenerateCaption(
      post.platform,
      post.caption,
      workspace.niche,
      workspace.creator_voice
    )

    const { data: updated, error: updateError } = await supabase
      .from('posts')
      .update({
        caption: result.caption,
        hashtags: result.hashtags,
      })
      .eq('id', id)
      .select('*, post_media(*)')
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json(updated)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to regenerate caption'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
