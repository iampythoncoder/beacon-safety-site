import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { isMissingTableError } from "../../../../lib/legacyRoadmap";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("project_id");
  const userId = searchParams.get("user_id");
  if (!projectId) return NextResponse.json({ error: "Missing project_id" }, { status: 400 });

  const { data, error } = await supabaseServer
    .from("business_plans")
    .select("id, version, created_at")
    .eq("project_id", projectId)
    .order("version", { ascending: false });
  const missingBusinessPlans = Boolean(error && isMissingTableError(error, "business_plans"));
  if (error && !missingBusinessPlans) return NextResponse.json({ error: error.message }, { status: 500 });
  if (data) return NextResponse.json(data);

  let { data: legacy, error: legacyError } = await supabaseServer
    .from("user_projects")
    .select("id, created_at")
    .eq("id", projectId)
    .maybeSingle();
  if (!legacy && !legacyError) {
    const alt = await supabaseServer
      .from("user_projects")
      .select("id, created_at")
      .filter("project_input->>generated_project_id", "eq", projectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    legacy = alt.data;
    legacyError = alt.error;
  }
  if (!legacy && !legacyError && userId) {
    const altByUser = await supabaseServer
      .from("user_projects")
      .select("id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    legacy = altByUser.data;
    legacyError = altByUser.error;
  }
  if (legacyError) return NextResponse.json({ error: legacyError.message }, { status: 500 });
  if (!legacy) return NextResponse.json([]);

  return NextResponse.json([{ id: `legacy-${legacy.id}`, version: 1, created_at: legacy.created_at }]);
}
