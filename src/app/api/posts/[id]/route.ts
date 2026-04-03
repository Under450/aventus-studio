import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateOrigin } from '@/lib/csrf'
import { validateCaption, validateHashtags } from '@/lib/validation'

export async function PATCH(
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
  const body = await request.json()

  // Fetch existing post
  const { data: existing, error: fetchError } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  if (existing.status === 'published') {
    return NextResponse.json({ error: 'Cannot edit a published post' }, { status: 400 })
  }

  // Build update object
  const updates: Record<string, unknown> = {}

  if (typeof body.caption === 'string') {
    updates.caption = validateCaption(body.caption)
  }
  if (Array.isArray(body.hashtags)) {
    updates.hashtags = validateHashtags(body.hashtags)
  }
  if (body.scheduled_at !== undefined) {
    updates.scheduled_at = body.scheduled_at
  }
  if (typeof body.status === 'string') {
    updates.status = body.status
  }

  // Auto-transition: if approving and has scheduled_at, set to scheduled
  if (updates.status === 'approved') {
    const effectiveScheduledAt = updates.scheduled_at !== undefined
      ? updates.scheduled_at
      : existing.scheduled_at
    if (effectiveScheduledAt) {
      updates.status = 'scheduled'
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', id)
    .select('*, post_media(*)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
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

  // Fetch existing post
  const { data: existing, error: fetchError } = await supabase
    .from('posts')
    .select('id, status')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  if (existing.status === 'published') {
    return NextResponse.json({ error: 'Cannot delete a published post' }, { status: 400 })
  }

  // Soft delete
  const { error } = await supabase
    .from('posts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
