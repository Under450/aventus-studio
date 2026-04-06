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

  const { caption, hashtags, creator_name, niche, brand_voice, platforms } = await request.json()

  if (!caption) {
    return NextResponse.json({ error: 'caption required' }, { status: 400 })
  }

  const selectedPlatforms = platforms || ['instagram', 'tiktok', 'x', 'reddit']

  const model = genAI.getGenerativeModel({ model: 'gemma-3-27b-it' })

  const prompt = `You are a social media copywriter. Adapt the following post caption for multiple platforms.

Original caption: ${caption}
Original hashtags: ${hashtags || 'none'}
Creator: ${creator_name || 'unknown'}
Niche: ${niche || 'general'}
Brand voice: ${brand_voice || 'confident and direct'}

Adapt this caption for each of these platforms: ${selectedPlatforms.join(', ')}

PLATFORM RULES:
- Instagram: Keep full length. Add relevant hashtags (up to 15). Professional but conversational.
- TikTok: Make it shorter and punchier. Maximum 3 hashtags. Casual, hook-driven.
- X/Twitter: MUST be under 280 characters total including hashtags. Sharp and direct. 1-2 hashtags max.
- LinkedIn: Professional, thought-leadership tone. 3-5 hashtags. Slightly longer, insightful.
- Reddit: No hashtags at all. Conversational, authentic tone. Write like a real person in a subreddit, not a brand.

STRICT RULES:
- NO emojis
- NO exclamation marks
- NO cliches ("game-changer", "crushing it", "levelling up")

Return ONLY a JSON object with this exact structure:
{
  "instagram": { "caption": "...", "hashtags": "..." },
  "tiktok": { "caption": "...", "hashtags": "..." },
  "x": { "caption": "...", "hashtags": "..." },
  "linkedin": { "caption": "...", "hashtags": "..." },
  "reddit": { "caption": "...", "hashtags": "" }
}

For hashtags field: space-separated hashtags with # prefix. Reddit hashtags must be empty string.
Return ONLY the JSON. No preamble.`

  const result = await model.generateContent(prompt)
  const text = result.response.text()
  const cleaned = text
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim()

  const parsed = JSON.parse(cleaned)
  return NextResponse.json(parsed)
}
