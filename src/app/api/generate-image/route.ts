import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateOrigin } from '@/lib/csrf'

export async function POST(request: Request) {
  if (!validateOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { prompt, quality } = body as {
    prompt?: string
    quality?: 'free' | 'premium'
  }

  if (!prompt || typeof prompt !== 'string') {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
  }

  try {
    if (quality === 'premium') {
      // FLUX Dev via fal.ai
      const falKey = process.env.FALAI_API_KEY || process.env.FAL_KEY || ''
      if (!falKey) {
        return NextResponse.json({
          error: 'FAL.ai API key not configured. Add FALAI_API_KEY to your .env.local file. Get a key at fal.ai/dashboard/keys',
        }, { status: 501 })
      }

      const { fal } = await import('@fal-ai/client')
      fal.config({ credentials: falKey })

      const result = await fal.subscribe('fal-ai/flux/dev', {
        input: {
          prompt,
          image_size: 'portrait_4_3',
          num_images: 1,
        },
      })

      const images = (result as { data: { images: { url: string }[] } }).data?.images
      if (!images?.[0]?.url) {
        return NextResponse.json({ error: 'FLUX Dev returned no image. Try a different prompt.' }, { status: 500 })
      }

      return NextResponse.json({ url: images[0].url, provider: 'flux-dev' })
    }

    // Free — Gemini Imagen 3 via @google/genai
    const { GoogleGenAI } = await import('@google/genai')
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })
    const result = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt,
      config: { numberOfImages: 1, aspectRatio: '4:3' },
    })

    const base64 = result.generatedImages?.[0]?.image?.imageBytes
    if (!base64) {
      return NextResponse.json({ error: 'Imagen returned no image. Try a different prompt.' }, { status: 500 })
    }

    return NextResponse.json({ base64, provider: 'imagen' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
