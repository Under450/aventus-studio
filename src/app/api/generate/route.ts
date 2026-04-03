import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { validateOrigin } from '@/lib/csrf'
import { generatePostOutlines } from '@/lib/gemini'
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
  const { workspace_id, topic } = body

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

  // Create generation batch
  const { data: batch, error: batchError } = await service
    .from('generation_batches')
    .insert({
      workspace_id,
      topic: cleanTopic,
      status: 'generating_text',
      total_posts: 21,
      posts_created: 0,
      images_completed: 0,
    })
    .select('id')
    .single()

  if (batchError || !batch) {
    return NextResponse.json({ error: 'Failed to create batch' }, { status: 500 })
  }

  try {
    const outlines = await generatePostOutlines(
      workspace.niche,
      workspace.creator_voice,
      cleanTopic || undefined
    )

    // Calculate dates starting from tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const postRows = outlines.map((outline) => {
      const postDate = new Date(tomorrow)
      postDate.setDate(postDate.getDate() + (outline.day - 1))

      // Parse suggested_time (e.g. "9:00 AM")
      const timeMatch = outline.suggested_time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
      if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10)
        const minutes = parseInt(timeMatch[2], 10)
        const ampm = timeMatch[3].toUpperCase()
        if (ampm === 'PM' && hours !== 12) hours += 12
        if (ampm === 'AM' && hours === 12) hours = 0
        postDate.setHours(hours, minutes, 0, 0)
      } else {
        postDate.setHours(9, 0, 0, 0)
      }

      return {
        workspace_id,
        platform: outline.platform as 'instagram' | 'tiktok' | 'youtube',
        caption: outline.caption,
        hashtags: outline.hashtags,
        media_type: 'image' as const,
        status: 'draft' as const,
        scheduled_at: postDate.toISOString(),
        ai_generated: true,
        ai_prompt: outline.image_prompt,
        generation_batch_id: batch.id,
      }
    })

    // Batch insert all posts
    const { data: posts, error: postsError } = await service
      .from('posts')
      .insert(postRows)
      .select('id')

    if (postsError || !posts) {
      throw new Error(postsError?.message || 'Failed to insert posts')
    }

    // Batch insert post_media rows
    const mediaRows = posts.map((post, i) => ({
      post_id: post.id,
      media_type: 'image' as const,
      position: 0,
      ai_image_prompt: outlines[i]?.image_prompt || null,
      image_status: 'pending' as const,
    }))

    await service.from('post_media').insert(mediaRows)

    // Update batch status
    await service
      .from('generation_batches')
      .update({
        status: 'generating_images',
        posts_created: posts.length,
      })
      .eq('id', batch.id)

    return NextResponse.json({
      batch_id: batch.id,
      posts_created: posts.length,
    })
  } catch (err) {
    // Update batch to failed
    const message = err instanceof Error ? err.message : 'Unknown error'
    await service
      .from('generation_batches')
      .update({ status: 'failed', error_message: message })
      .eq('id', batch.id)

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
