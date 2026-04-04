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
    .select("id, post_id, ai_image_prompt")
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

  // Mark all as 'generating'
  await supabase
    .from("post_media")
    .update({ image_status: "generating" })
    .in("id", pendingMedia.map((m) => m.id));

  // Process in parallel
  const results = await Promise.allSettled(
    pendingMedia.map(async (media) => {
      const usage = await checkAndIncrement("gemini_imagen");
      if (!usage.allowed) {
        await supabase.from("post_media").update({ image_status: "pending" }).eq("id", media.id);
        return "skipped" as const;
      }

      if (!media.ai_image_prompt) {
        await supabase.from("post_media").update({ image_status: "failed" }).eq("id", media.id);
        return "failed" as const;
      }

      const buffer = await generateImageBuffer(media.ai_image_prompt);
      if (!buffer) {
        await supabase.from("post_media").update({ image_status: "failed" }).eq("id", media.id);
        return "failed" as const;
      }

      const storagePath = `posts/${media.post_id}/${media.id}.png`;
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(storagePath, buffer, { contentType: "image/png", upsert: true });

      if (uploadError) {
        await supabase.from("post_media").update({ image_status: "failed" }).eq("id", media.id);
        return "failed" as const;
      }

      const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(storagePath);
      await supabase.from("post_media").update({ image_status: "completed", media_url: publicUrl }).eq("id", media.id);
      return "completed" as const;
    })
  );

  let completed = 0;
  let failed = 0;
  for (const r of results) {
    if (r.status === "fulfilled") {
      if (r.value === "completed") completed++;
      if (r.value === "failed") failed++;
    } else {
      failed++;
    }
  }

  // Update generation_batch statuses via posts table
  const postIds = [...new Set(pendingMedia.map((m) => m.post_id))];
  const batchIds = new Set<string>();

  for (const postId of postIds) {
    const { data: post } = await supabase
      .from("posts")
      .select("generation_batch_id")
      .eq("id", postId)
      .single();
    if (post?.generation_batch_id) batchIds.add(post.generation_batch_id);
  }

  for (const batchId of batchIds) {
    // Get all post IDs in this batch
    const { data: batchPosts } = await supabase
      .from("posts")
      .select("id")
      .eq("generation_batch_id", batchId);
    if (!batchPosts) continue;

    // Get all media for those posts
    const { data: allMedia } = await supabase
      .from("post_media")
      .select("image_status")
      .in("post_id", batchPosts.map((p) => p.id));
    if (!allMedia) continue;

    const hasPending = allMedia.some(
      (m) => m.image_status === "pending" || m.image_status === "generating"
    );
    const hasFailed = allMedia.some((m) => m.image_status === "failed");
    const doneCount = allMedia.filter((m) => m.image_status === "completed").length;

    if (!hasPending) {
      await supabase
        .from("generation_batches")
        .update({ status: hasFailed ? "partial" : "completed", images_completed: doneCount })
        .eq("id", batchId);
    } else {
      await supabase
        .from("generation_batches")
        .update({ images_completed: doneCount })
        .eq("id", batchId);
    }
  }

  return NextResponse.json({ processed: pendingMedia.length, completed, failed });
}
