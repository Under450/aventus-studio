import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateOrigin } from '@/lib/csrf'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const workspaceId = url.searchParams.get('workspace_id')
  if (!workspaceId) {
    return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('creator_profiles')
    .select('*')
    .eq('workspace_id', workspaceId)
    .single()

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || null)
}

export async function POST(request: Request) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const {
    workspace_id,
    onlyfans_handle,
    content_type,
    brand_voice,
    target_audience,
    platforms,
    brand_primary_color,
    brand_secondary_color,
    logo_url,
    mood_board_urls,
  } = body

  if (!workspace_id) {
    return NextResponse.json({ error: 'workspace_id required' }, { status: 400 })
  }

  // Verify workspace ownership
  const { data: ws } = await supabase
    .from('workspaces')
    .select('id')
    .eq('id', workspace_id)
    .is('deleted_at', null)
    .single()

  if (!ws) {
    return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
  }

  // Upsert: create or update
  const { data, error } = await supabase
    .from('creator_profiles')
    .upsert(
      {
        workspace_id,
        onlyfans_handle: onlyfans_handle || '',
        content_type: content_type || '',
        brand_voice: brand_voice || '',
        target_audience: target_audience || '',
        platforms: platforms || [],
        brand_primary_color: brand_primary_color || '#0f0f0d',
        brand_secondary_color: brand_secondary_color || '#faf8f5',
        logo_url: logo_url || '',
        mood_board_urls: mood_board_urls || [],
      },
      { onConflict: 'workspace_id' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
