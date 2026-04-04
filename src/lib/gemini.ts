import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fal from "@fal-ai/client";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Configure fal.ai client if key is available
if (process.env.FALAI_API_KEY) {
  fal.config({ credentials: process.env.FALAI_API_KEY });
}

// ---------------------------------------------------------------------------
// Post generation — one post at a time
// ---------------------------------------------------------------------------

export interface GeneratedPost {
  caption: string;
  hashtags: string[];
  image_prompt: string;
}

export async function enhanceAndGeneratePost(
  platform: string,
  brief: string,
  tone: string,
  creatorVoice: string
): Promise<GeneratedPost> {
  const model = genAI.getGenerativeModel({ model: "gemma-3-27b-it" });

  const prompt = `You are a professional social media copywriter for a creator management agency called Aventus. Write clean, professional, brand-appropriate social media copy.

Platform: ${platform}
Brief: ${brief}
Tone: ${tone || 'confident and professional'}
Creator voice: ${creatorVoice || 'professional, direct, authentic'}

STRICT RULES:
- NO emojis whatsoever unless the tone explicitly requests them
- NO exclamation marks
- NO clichés ("journey", "game-changer", "hustle", "crushing it", "levelling up")
- NO lifestyle fluff or generic motivational language
- Write like a real person, not a marketing bot
- Caption must be appropriate for ${platform} — concise for X, professional for LinkedIn, conversational for Instagram and TikTok
- Hashtags must be relevant and specific, not generic (#love, #instagood etc)
- Maximum 5 hashtags for LinkedIn, 20 for Instagram, 10 for TikTok and X

Return ONLY a JSON object with:
- "caption": string
- "hashtags": string[] (with # prefix)
- "image_prompt": string (professional photography style, no people, no text overlays)

Return ONLY the JSON. No preamble, no explanation.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const cleaned = text
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();

  return JSON.parse(cleaned) as GeneratedPost;
}

// ---------------------------------------------------------------------------
// Caption regeneration
// ---------------------------------------------------------------------------

export interface RegeneratedCaption {
  caption: string;
  hashtags: string[];
}

export async function regenerateCaption(
  platform: string,
  currentCaption: string,
  niche: string,
  creatorVoice: string
): Promise<RegeneratedCaption> {
  const model = genAI.getGenerativeModel({ model: "gemma-3-27b-it" });

  const prompt = `You are a social media content expert. Rewrite this ${platform} caption with a fresh angle.

Niche: ${niche}
Creator voice/style: ${creatorVoice}
Current caption: ${currentCaption}

Return ONLY a JSON object with:
- "caption": string (the new caption)
- "hashtags": string[] (relevant hashtags with # prefix)

Return ONLY the JSON object, no other text.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const cleaned = text
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();

  return JSON.parse(cleaned) as RegeneratedCaption;
}

// ---------------------------------------------------------------------------
// Image generation — free (Gemini Imagen) or premium (FLUX Dev via fal.ai)
// ---------------------------------------------------------------------------

const ASPECT_RATIOS: Record<string, { imagen: string; fal: string }> = {
  instagram: { imagen: "1:1", fal: "square" },
  tiktok: { imagen: "9:16", fal: "portrait_16_9" },
  youtube: { imagen: "16:9", fal: "landscape_16_9" },
  linkedin: { imagen: "1:1", fal: "square" },
  x: { imagen: "16:9", fal: "landscape_16_9" },
};

export interface GeneratedImage {
  url: string;
  provider: "imagen" | "flux-dev";
}

export async function generateImage(
  prompt: string,
  platform: string,
  quality: "free" | "premium"
): Promise<GeneratedImage> {
  const ratios = ASPECT_RATIOS[platform] || ASPECT_RATIOS.instagram;

  if (quality === "premium") {
    // FLUX Dev via fal.ai
    if (!process.env.FALAI_API_KEY) {
      throw new Error("FALAI_API_KEY is required for premium image generation");
    }

    const result = await fal.subscribe("fal-ai/flux/dev", {
      input: {
        prompt,
        image_size: ratios.fal,
        num_images: 1,
      },
    });

    const images = (result as { data: { images: { url: string }[] } }).data
      ?.images;
    if (!images?.[0]?.url) {
      throw new Error("FLUX Dev returned no image");
    }

    return { url: images[0].url, provider: "flux-dev" };
  }

  // Free — Gemini Imagen
  const imagenModel = genAI.getGenerativeModel({
    model: "imagen-3.0-generate-002",
  });

  const result = await imagenModel.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ["image", "text"],
    } as Record<string, unknown>,
  });

  const response = result.response;
  const parts = response.candidates?.[0]?.content?.parts;
  const imagePart = parts?.find(
    (p: Record<string, unknown>) => p.inlineData
  ) as { inlineData: { data: string; mimeType: string } } | undefined;

  if (!imagePart?.inlineData?.data) {
    throw new Error("Imagen returned no image data");
  }

  // Return as a data URI
  const dataUri = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
  return { url: dataUri, provider: "imagen" };
}
