import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { computeLegacyProgress, isMissingTableError, normalizeRoadmap } from "../../../../lib/legacyRoadmap";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { project_id, user_id, entry, links, results, task_ids } = body || {};
    if (!project_id || !user_id || !entry) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { error } = await supabaseServer.from("progress_logs").insert({
      project_id,
      user_id,
      entry,
      links: links || "",
      results: results || ""
    });
    const missingProgressLogs = Boolean(error && isMissingTableError(error, "progress_logs"));
    if (error && !missingProgressLogs) throw new Error(error.message);

    if (Array.isArray(task_ids) && task_ids.length > 0) {
      const { error: taskError } = await supabaseServer
        .from("roadmap_tasks")
        .update({ completed: true })
        .in("task_id", task_ids);
      if (taskError && !isMissingTableError(taskError, "roadmap_tasks")) {
        throw new Error(taskError.message);
      }
      if (taskError && isMissingTableError(taskError, "roadmap_tasks")) {
        const { data: legacyRow, error: legacyError } = await supabaseServer
          .from("user_projects")
          .select("roadmap, progress")
          .eq("id", project_id)
          .maybeSingle();
        if (legacyError) throw new Error(legacyError.message);
        const roadmap = normalizeRoadmap(legacyRow?.roadmap);
        const seed = legacyRow?.progress && typeof legacyRow.progress === "object" ? legacyRow.progress : {};
        const merged = {
          ...seed,
          tasks: {
            ...(seed.tasks && typeof seed.tasks === "object" ? seed.tasks : {}),
            ...task_ids.reduce((acc: Record<string, boolean>, id: string) => {
              acc[id] = true;
              return acc;
            }, {})
          }
        };
        const recomputed = computeLegacyProgress(roadmap, merged);
        await supabaseServer
          .from("user_projects")
          .update({
            progress: {
              ...merged,
              tasks: recomputed.tasks,
              stages: recomputed.stages,
              unlockedStages: recomputed.unlockedStages
            }
          })
          .eq("id", project_id);
      }
    }

    if (missingProgressLogs) {
      const { data: legacyRow } = await supabaseServer
        .from("user_projects")
        .select("progress")
        .eq("id", project_id)
        .maybeSingle();
      const seed = legacyRow?.progress && typeof legacyRow.progress === "object" ? legacyRow.progress : {};
      const logs = Array.isArray(seed.logs) ? seed.logs : [];
      logs.unshift({ entry, links: links || "", results: results || "", created_at: new Date().toISOString() });
      await supabaseServer
        .from("user_projects")
        .update({ progress: { ...seed, logs: logs.slice(0, 20) } })
        .eq("id", project_id);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to log progress" }, { status: 500 });
  }
}
