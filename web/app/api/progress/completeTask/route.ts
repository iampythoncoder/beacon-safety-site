import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { computeLegacyProgress, isMissingTableError, normalizeRoadmap } from "../../../../lib/legacyRoadmap";
import { getValidationState, shouldEnforceValidationGate } from "../../../../lib/validationTracker";

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

      let unlockBlocked = false;
      let validationGate: any = null;
      const stageIndex = roadmap.findIndex((stage) => stage.stage_id === stage_row_id);
      const nextStage = stageIndex >= 0 ? roadmap[stageIndex + 1] : null;
      if (nextStage && shouldEnforceValidationGate(nextStage.stage_name)) {
        const validation = await getValidationState(project_id);
        if (!validation.status.milestone_ready) {
          unlockBlocked = true;
          validationGate = validation.status;
          finalProgress.unlockedStages = {
            ...(finalProgress.unlockedStages || {}),
            [nextStage.stage_id]: false
          };
        }
      }

      const { error: saveError } = await supabaseServer
        .from("user_projects")
        .update({ progress: finalProgress })
        .eq("id", project_id);
      if (saveError) throw new Error(saveError.message);

      return NextResponse.json({
        ok: true,
        allComplete: Boolean(recomputed.stages?.[stage_row_id]?.completed),
        unlock_blocked: unlockBlocked,
        validation_gate: validationGate
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
        const { data: nextStage } = await supabaseServer
          .from("roadmap_stages")
          .select("id, stage_name")
          .eq("project_id", stage.project_id)
          .eq("position", stage.position + 1)
          .maybeSingle();

        if (nextStage && shouldEnforceValidationGate(nextStage.stage_name)) {
          const validation = await getValidationState(stage.project_id);
          if (!validation.status.milestone_ready) {
            return NextResponse.json({
              ok: true,
              allComplete,
              unlock_blocked: true,
              validation_gate: validation.status
            });
          }
        }

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
