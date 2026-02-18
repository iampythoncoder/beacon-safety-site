import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { isMissingTableError } from "../../../../lib/legacyRoadmap";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("user_id");
  if (!userId) return NextResponse.json({ error: "Missing user_id" }, { status: 400 });

  const { data, error } = await supabaseServer
    .from("users")
    .select("has_completed_onboarding")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    if (isMissingTableError(error, "users")) {
      return NextResponse.json({ has_completed_onboarding: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    await supabaseServer.from("users").upsert({ user_id: userId, has_completed_onboarding: false });
    return NextResponse.json({ has_completed_onboarding: false });
  }
  return NextResponse.json(data);
}
