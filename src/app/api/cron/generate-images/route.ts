import { NextResponse } from "next/server";
import { createServiceClient, validateCronSecret } from "@/lib/supabase/server";
import { generateImage } from "@/lib/gemini";
import { checkAndIncrement } from "@/lib/api-usage";

export async function POST(request: Request) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const body = await request.json().catch(() => ({}));
  const mediaId = (body as { media_id?: string }).media_id;
  const quality = ((body as { quality?: string }).quality || "free") as "free" | "premium";

  if (!mediaId) {
    return NextResponse.json({ error: "media_id is required" }, { status: 400 });
  }

  // Fetch the single media record
  const { data: media, error: fetchError } = await supabase
    .from("post_media")
    .select("id, post_id, ai_image_prompt")
    .eq("id", mediaId)
    .single();

  if (fetchError || !media) {
    return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }

  if (!media.ai_image_prompt) {
    await supabase.from("post_media").update({ image_status: "failed" }).eq("id", media.id);
    return NextResponse.json({ error: "No image prompt" }, { status: 400 });
  }

  // Rate limit check
  const usage = await checkAndIncrement("gemini_imagen");
  if (!usage.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", remaining: usage.remaining },
      { status: 429 }
    );
  }

  // Mark as generating
  await supabase.from("post_media").update({ image_status: "generating" }).eq("id", media.id);

  try {
    // Get platform from parent post for aspect ratio
    const { data: post } = await supabase
      .from("posts")
      .select("platform")
      .eq("id", media.post_id)
      .single();

    const platform = post?.platform || "instagram";
    const result = await generateImage(media.ai_image_prompt, platform, quality);

    if (result.provider === "imagen") {
      // Data URI — decode base64 and upload to storage
      const base64Match = result.url.match(/^data:(.+);base64,(.+)$/);
      if (!base64Match) throw new Error("Invalid data URI from Imagen");

      const contentType = base64Match[1];
      const buffer = Buffer.from(base64Match[2], "base64");
      const ext = contentType.includes("png") ? "png" : "jpg";
      const storagePath = `posts/${media.post_id}/${media.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(storagePath, buffer, { contentType, upsert: true });

      if (uploadError) throw new Error(uploadError.message);

      const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(storagePath);
      await supabase.from("post_media").update({ image_status: "completed", media_url: publicUrl }).eq("id", media.id);

      return NextResponse.json({ status: "completed", provider: "imagen", url: publicUrl });
    } else {
      // FLUX Dev — URL already hosted
      await supabase.from("post_media").update({ image_status: "completed", media_url: result.url }).eq("id", media.id);
      return NextResponse.json({ status: "completed", provider: "flux-dev", url: result.url });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await supabase.from("post_media").update({ image_status: "failed" }).eq("id", media.id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
