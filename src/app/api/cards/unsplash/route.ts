import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const query = url.searchParams.get('q')
  if (!query) {
    return NextResponse.json({ error: 'q parameter required' }, { status: 400 })
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey) {
    return NextResponse.json({ error: 'UNSPLASH_ACCESS_KEY not configured' }, { status: 501 })
  }

  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12&orientation=portrait`,
    { headers: { Authorization: `Client-ID ${accessKey}` } }
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'Unsplash API error' }, { status: 502 })
  }

  const data = await res.json()
  const photos = data.results.map((p: { id: string; urls: { regular: string; small: string }; alt_description: string | null; user: { name: string } }) => ({
    id: p.id,
    url: p.urls.regular,
    thumb: p.urls.small,
    alt: p.alt_description || '',
    photographer: p.user.name,
  }))

  return NextResponse.json(photos)
}
