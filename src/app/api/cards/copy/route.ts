import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateOrigin } from '@/lib/csrf'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: Request) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { creator_name, niche, brand_voice, target_audience, topic } = await request.json()

  if (!creator_name || !topic) {
    return NextResponse.json({ error: 'creator_name and topic required' }, { status: 400 })
  }

  const model = genAI.getGenerativeModel({ model: 'gemma-3-27b-it' })

  const prompt = `You are writing copy for a branded social media card image. The text will be overlaid on an image, so it must be SHORT and PUNCHY.

Creator: ${creator_name}
Niche: ${niche || 'general'}
Brand voice: ${brand_voice || 'confident and direct'}
Target audience: ${target_audience || 'general'}
Topic: ${topic}

Write:
1. A headline (max 8 words, bold statement)
2. A subtext line (max 15 words, supporting message)

RULES:
- NO emojis
- NO hashtags
- NO exclamation marks
- Be direct, not generic

Return ONLY a JSON object: { "headline": "...", "subtext": "..." }
No preamble, no explanation.`

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  const cleaned = text
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim()

  const parsed = JSON.parse(cleaned) as { headline: string; subtext: string }
  return NextResponse.json(parsed)
}
