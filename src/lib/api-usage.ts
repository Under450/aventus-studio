import { createServiceClient } from "@/lib/supabase/server";

const LIMITS: Record<string, number> = {
  gemini_text: 1000,
  gemini_imagen: 500,
  instagram: 200,
  tiktok: 15,
  youtube: 10000,
};

export interface UsageResult {
  allowed: boolean;
  remaining: number;
}

export async function checkAndIncrement(
  service: string,
  workspaceId?: string
): Promise<UsageResult> {
  const limit = LIMITS[service];
  if (limit === undefined) {
    return { allowed: true, remaining: 0 };
  }

  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase.rpc("increment_api_usage", {
      p_service: service,
      p_workspace_id: workspaceId ?? null,
      p_limit: limit,
    });

    if (error) {
      // Fail open — allow the request if RPC fails
      console.error("API usage check failed, failing open:", error.message);
      return { allowed: true, remaining: limit };
    }

    // RPC returns the new count; remaining = limit - count
    const count = typeof data === "number" ? data : 0;
    const remaining = Math.max(0, limit - count);

    return {
      allowed: count <= limit,
      remaining,
    };
  } catch (err) {
    // Fail open
    console.error("API usage check error, failing open:", err);
    return { allowed: true, remaining: limit };
  }
}
