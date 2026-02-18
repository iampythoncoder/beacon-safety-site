import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { computeLegacyProgress, isMissingTableError, normalizeRoadmap } from "../../../../lib/legacyRoadmap";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { task_id, stage_row_id, project_id, completed } = body || {};
    if (!task_id || !stage_row_id) {
      return NextResponse.json({ error: "Missing task_id or stage_row_id" }, { status: 400 });
    }

    const { data: updatedRows, error } = await supabaseServer
      .from("roadmap_tasks")
      .update({ completed: !!completed })
      .eq("task_id", task_id)
      .eq("stage_row_id", stage_row_id)
      .select("task_id");
    const legacyMode = Boolean(error && isMissingTableError(error, "roadmap_tasks"));
    if (error && !legacyMode) throw new Error(error.message);
    const noModernMatch = !error && (!updatedRows || updatedRows.length === 0);

    if (legacyMode || noModernMatch) {
      if (!project_id) {
        return NextResponse.json({ error: "Missing project_id for legacy task updates" }, { status: 400 });
      }
      const { data: legacyRow, error: legacyError } = await supabaseServer
        .from("user_projects")
        .select("roadmap, progress")
        .eq("id", project_id)
        .maybeSingle();
      if (legacyError) throw new Error(legacyError.message);

      const roadmap = normalizeRoadmap(legacyRow?.roadmap);
      const progressSeed = legacyRow?.progress && typeof legacyRow.progress === "object" ? legacyRow.progress : {};
      const mergedProgress = {
        ...progressSeed,
        tasks: {
          ...(progressSeed.tasks && typeof progressSeed.tasks === "object" ? progressSeed.tasks : {}),
          [task_id]: !!completed
        }
      };
      const recomputed = computeLegacyProgress(roadmap, mergedProgress);
      const finalProgress = {
        ...mergedProgress,
        tasks: recomputed.tasks,
        stages: recomputed.stages,
        unlockedStages: recomputed.unlockedStages
      };

      const { error: saveError } = await supabaseServer
        .from("user_projects")
        .update({ progress: finalProgress })
        .eq("id", project_id);
      if (saveError) throw new Error(saveError.message);

      return NextResponse.json({
        ok: true,
        allComplete: Boolean(recomputed.stages?.[stage_row_id]?.completed)
      });
    }

    const { data: tasks } = await supabaseServer
      .from("roadmap_tasks")
      .select("completed")
      .eq("stage_row_id", stage_row_id);

    const allComplete = (tasks || []).length > 0 && (tasks || []).every((t) => t.completed);
    if (allComplete) {
      const { data: stage } = await supabaseServer
        .from("roadmap_stages")
        .select("project_id, position")
        .eq("id", stage_row_id)
        .single();
      if (stage) {
        await supabaseServer
          .from("roadmap_stages")
          .update({ unlocked: true })
          .eq("project_id", stage.project_id)
          .eq("position", stage.position + 1);
      }
    }

    return NextResponse.json({ ok: true, allComplete });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to complete task" }, { status: 500 });
  }
}
