import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateOrigin } from '@/lib/csrf'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const workspace_id = searchParams.get('workspace_id')

  if (!workspace_id) {
    return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 })
  }

  const status = searchParams.get('status')
  const limitParam = parseInt(searchParams.get('limit') || '50', 10)
  const limit = Math.min(Math.max(1, limitParam), 100)

  let query = supabase
    .from('posts')
    .select('*, post_media(*)')
    .eq('workspace_id', workspace_id)
    .is('deleted_at', null)
    .order('scheduled_at', { ascending: true, nullsFirst: false })
    .limit(limit)

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { workspace_id, platform, caption, hashtags, scheduled_at } = body

  if (!workspace_id || typeof workspace_id !== 'string') {
    return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 })
  }

  if (!platform || !['instagram', 'tiktok', 'youtube'].includes(platform)) {
    return NextResponse.json({ error: 'Valid platform is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      workspace_id,
      platform,
      caption: caption || '',
      hashtags: hashtags || [],
      media_type: 'image',
      status: 'draft',
      scheduled_at: scheduled_at || null,
      ai_generated: false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
