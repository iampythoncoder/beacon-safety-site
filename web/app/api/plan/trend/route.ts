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
    .select("version, plan")
    .eq("project_id", projectId)
    .order("version", { ascending: true });
  const missingBusinessPlans = Boolean(error && isMissingTableError(error, "business_plans"));
  if (error && !missingBusinessPlans) return NextResponse.json({ error: error.message }, { status: 500 });

  if (data && data.length > 0) {
    const trend = (data || []).map((row: any) => {
      const rating = row.plan?.idea_rating || {};
      const scores = Object.values(rating).filter((v) => typeof v === "number") as number[];
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      return { version: row.version, average: avg };
    });
    return NextResponse.json(trend);
  }

  let { data: legacy, error: legacyError } = await supabaseServer
    .from("user_projects")
    .select("idea_rating")
    .eq("id", projectId)
    .maybeSingle();
  if (!legacy && !legacyError) {
    const alt = await supabaseServer
      .from("user_projects")
      .select("idea_rating")
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
      .select("idea_rating")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    legacy = altByUser.data;
    legacyError = altByUser.error;
  }
  if (legacyError) return NextResponse.json({ error: legacyError.message }, { status: 500 });

  const rating = legacy?.idea_rating || {};
  const scores = Object.values(rating).filter((v) => typeof v === "number") as number[];
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  return NextResponse.json(avg ? [{ version: 1, average: avg }] : []);
}
