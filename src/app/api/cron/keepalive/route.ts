import { NextResponse } from "next/server";
import { createServiceClient, validateCronSecret } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { error } = await supabase.from("workspaces").select("id").limit(1);

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
