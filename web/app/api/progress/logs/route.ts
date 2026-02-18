import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { isMissingTableError } from "../../../../lib/legacyRoadmap";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("project_id");
  if (!projectId) return NextResponse.json({ error: "Missing project_id" }, { status: 400 });

  const { data, error } = await supabaseServer
    .from("progress_logs")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(20);
  const missingProgressLogs = Boolean(error && isMissingTableError(error, "progress_logs"));
  if (error && !missingProgressLogs) return NextResponse.json({ error: error.message }, { status: 500 });
  if (data) return NextResponse.json(data);

  const { data: legacy, error: legacyError } = await supabaseServer
    .from("user_projects")
    .select("progress")
    .eq("id", projectId)
    .maybeSingle();
  if (legacyError) return NextResponse.json({ error: legacyError.message }, { status: 500 });
  const logs = Array.isArray(legacy?.progress?.logs) ? legacy.progress.logs : [];
  return NextResponse.json(logs.slice(0, 20));
}
