import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { validateOrigin } from '@/lib/csrf'

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
  const updates: Record<string, string> = {}
  if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim()
  if (typeof body.niche === 'string') updates.niche = body.niche
  if (typeof body.creator_voice === 'string') updates.creator_voice = body.creator_voice

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('workspaces')
    .update(updates)
    .eq('id', id)
    .select()
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

  // Verify ownership via authenticated client
  const { data: workspace, error: fetchError } = await supabase
    .from('workspaces')
    .select('id')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (fetchError || !workspace) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  // Use service client for operations that need to bypass RLS
  const service = createServiceClient()

  // Cancel scheduled posts before soft-deleting
  await service
    .from('posts')
    .update({ status: 'draft', scheduled_at: null })
    .eq('workspace_id', id)
    .eq('status', 'scheduled')

  // Soft delete the workspace
  const { error: deleteError } = await service
    .from('workspaces')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
