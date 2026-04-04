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
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

CRITICAL IMAGE PROMPT RULES:
- Image prompts must be BRAND-SAFE and suitable for all audiences
- Focus on lifestyle, aesthetics, environments, objects, and abstract concepts
- NEVER describe people's bodies, clothing details, or suggestive poses
- Use professional photography style descriptions: lighting, composition, colour palette, mood
- Think magazine editorial, product photography, or scenic lifestyle shots
- Examples of good prompts: "Flat lay of luxury skincare products on marble with golden hour light", "Aerial view of a modern gym with natural lighting", "Minimalist workspace with coffee and notebook, soft morning light"

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
    // Pollinations.ai — free, no API key, no region restrictions
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1080&height=1080&nologo=true`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
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
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
