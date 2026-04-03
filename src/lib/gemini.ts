import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface PostOutline {
  day: number;
  platform: string;
  caption: string;
  hashtags: string[];
  suggested_time: string;
  image_prompt: string;
}

export async function generatePostOutlines(
  niche: string,
  creatorVoice: string,
  topic?: string
): Promise<PostOutline[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

  const topicLine = topic ? `Focus on this topic: ${topic}` : "";

  const prompt = `You are a social media content strategist. Generate a 7-day content plan with 3 posts per day (one for Instagram, one for TikTok, one for YouTube).

Niche: ${niche}
Creator voice/style: ${creatorVoice}
${topicLine}

Return ONLY a JSON array with exactly 21 objects. Each object must have:
- "day": number (1-7)
- "platform": "instagram" | "tiktok" | "youtube"
- "caption": string (platform-appropriate caption)
- "hashtags": string[] (relevant hashtags with # prefix)
- "suggested_time": string (e.g. "9:00 AM")
- "image_prompt": string (detailed prompt for generating a visual for this post)

Return ONLY the JSON array, no other text.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Strip markdown code fences if present
  const cleaned = text
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();

  return JSON.parse(cleaned) as PostOutline[];
}

export async function generateImageBuffer(
  prompt: string
): Promise<Buffer | null> {
  try {
    // Try Imagen 3 via generateImages
    const imagenModel = genAI.getGenerativeModel({
      model: "imagen-3.0-generate-002",
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (imagenModel as any).generateImages === "function") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (imagenModel as any).generateImages({
        prompt,
        config: { numberOfImages: 1, outputMimeType: "image/png" },
      });

      if (result?.images?.[0]?.data) {
        return Buffer.from(result.images[0].data, "base64");
      }
    }

    // Fallback: use generateContent with image response mime type
    const fallbackModel = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
    });

    const result = await fallbackModel.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: `Generate an image: ${prompt}` }],
        },
      ],
      generationConfig: {
        responseMimeType: "image/png",
      },
    });

    const parts = result.response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData?.data) {
          return Buffer.from(part.inlineData.data, "base64");
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}

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
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

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
