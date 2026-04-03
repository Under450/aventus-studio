import { NextResponse } from "next/server";
import { createServiceClient, validateCronSecret } from "@/lib/supabase/server";
import { generateImageBuffer } from "@/lib/gemini";
import { checkAndIncrement } from "@/lib/api-usage";

export async function POST(request: Request) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Find pending images (max 5 per run)
  const { data: pendingMedia, error: fetchError } = await supabase
    .from("post_media")
    .select("id, post_id, ai_image_prompt, batch_id")
    .eq("image_status", "pending")
    .limit(5);

  if (fetchError) {
    return NextResponse.json(
      { error: "Failed to fetch pending media", detail: fetchError.message },
      { status: 500 }
    );
  }

  if (!pendingMedia || pendingMedia.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  // Mark all as 'generating' immediately
  const mediaIds = pendingMedia.map((m) => m.id);
  await supabase
    .from("post_media")
    .update({ image_status: "generating" })
    .in("id", mediaIds);

  // Process in parallel
  const results = await Promise.allSettled(
    pendingMedia.map(async (media) => {
      // Check rate limit
      const usage = await checkAndIncrement("gemini_imagen");
      if (!usage.allowed) {
        // Set back to pending for retry next run
        await supabase
          .from("post_media")
          .update({ image_status: "pending" })
          .eq("id", media.id);
        return "skipped" as const;
      }

      // Validate prompt exists
      if (!media.ai_image_prompt) {
        await supabase
          .from("post_media")
          .update({ image_status: "failed" })
          .eq("id", media.id);
        return "failed" as const;
      }

      // Generate image
      const buffer = await generateImageBuffer(media.ai_image_prompt);
      if (!buffer) {
        await supabase
          .from("post_media")
          .update({ image_status: "failed" })
          .eq("id", media.id);
        return "failed" as const;
      }

      // Upload to Supabase Storage
      const storagePath = `posts/${media.post_id}/${media.id}.png`;
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(storagePath, buffer, {
          contentType: "image/png",
          upsert: true,
        });

      if (uploadError) {
        await supabase
          .from("post_media")
          .update({ image_status: "failed" })
          .eq("id", media.id);
        return "failed" as const;
      }

      // Get public URL and update record
      const {
        data: { publicUrl },
      } = supabase.storage.from("media").getPublicUrl(storagePath);

      await supabase
        .from("post_media")
        .update({ image_status: "completed", media_url: publicUrl })
        .eq("id", media.id);

      return "completed" as const;
    })
  );

  // Count results
  let completed = 0;
  let failed = 0;
  for (const result of results) {
    if (result.status === "fulfilled") {
      if (result.value === "completed") completed++;
      if (result.value === "failed") failed++;
    } else {
      failed++;
    }
  }

  // Update generation_batch statuses
  const batchIds = [
    ...new Set(
      pendingMedia.map((m) => m.batch_id).filter(Boolean) as string[]
    ),
  ];

  for (const batchId of batchIds) {
    const { data: batchMedia } = await supabase
      .from("post_media")
      .select("image_status")
      .eq("batch_id", batchId);

    if (!batchMedia) continue;

    const hasPending = batchMedia.some(
      (m) => m.image_status === "pending" || m.image_status === "generating"
    );
    const hasFailed = batchMedia.some((m) => m.image_status === "failed");
    const completedCount = batchMedia.filter(
      (m) => m.image_status === "completed"
    ).length;

    if (!hasPending) {
      // All done — set final status
      await supabase
        .from("generation_batches")
        .update({
          status: hasFailed ? "partial" : "completed",
          images_completed: completedCount,
        })
        .eq("id", batchId);
    } else {
      // Still in progress — just update count
      await supabase
        .from("generation_batches")
        .update({ images_completed: completedCount })
        .eq("id", batchId);
    }
  }

  return NextResponse.json({
    processed: pendingMedia.length,
    completed,
    failed,
  });
}
