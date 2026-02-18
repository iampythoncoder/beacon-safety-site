import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";
import { isMissingTableError, normalizeRoadmap, roadmapToApiStages } from "../../../lib/legacyRoadmap";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("project_id");
  if (!projectId) return NextResponse.json({ error: "Missing project_id" }, { status: 400 });

  const { data: stages, error: stageError } = await supabaseServer
    .from("roadmap_stages")
    .select("*")
    .eq("project_id", projectId)
    .order("position", { ascending: true });
  const legacyMode = Boolean(stageError && isMissingTableError(stageError, "roadmap_stages"));
  if (stageError && !legacyMode) return NextResponse.json({ error: stageError.message }, { status: 500 });

  if (legacyMode) {
    const { data: legacy, error: legacyError } = await supabaseServer
      .from("user_projects")
      .select("roadmap, progress")
      .eq("id", projectId)
      .maybeSingle();
    if (legacyError) return NextResponse.json({ error: legacyError.message }, { status: 500 });
    const normalized = normalizeRoadmap(legacy?.roadmap);
    return NextResponse.json(roadmapToApiStages(normalized, legacy?.progress || {}));
  }

  if (!stages || stages.length === 0) {
    const { data: legacy, error: legacyError } = await supabaseServer
      .from("user_projects")
      .select("roadmap, progress")
      .eq("id", projectId)
      .maybeSingle();
    if (!legacyError && legacy?.roadmap) {
      const normalized = normalizeRoadmap(legacy.roadmap);
      return NextResponse.json(roadmapToApiStages(normalized, legacy.progress || {}));
    }
  }

  const stageIds = (stages || []).map((s) => s.id);
  const { data: tasks, error: taskError } = await supabaseServer
    .from("roadmap_tasks")
    .select("*")
    .in("stage_row_id", stageIds.length ? stageIds : ["00000000-0000-0000-0000-000000000000"])
    .order("week", { ascending: true })
    .order("position", { ascending: true });
  if (taskError) {
    if (isMissingTableError(taskError, "roadmap_tasks")) {
      const { data: legacy, error: legacyError } = await supabaseServer
        .from("user_projects")
        .select("roadmap, progress")
        .eq("id", projectId)
        .maybeSingle();
      if (legacyError) return NextResponse.json({ error: legacyError.message }, { status: 500 });
      const normalized = normalizeRoadmap(legacy?.roadmap);
      return NextResponse.json(roadmapToApiStages(normalized, legacy?.progress || {}));
    }
    return NextResponse.json({ error: taskError.message }, { status: 500 });
  }

  const grouped = (stages || []).map((stage) => ({
    ...stage,
    tasks: (tasks || []).filter((task) => task.stage_row_id === stage.id)
  }));

  return NextResponse.json(grouped);
}
