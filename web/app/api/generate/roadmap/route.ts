import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { createGroqClient, generateRoadmap } from "../../../../lib/groq";
import { computeLegacyProgress, isMissingTableError, normalizeRoadmap } from "../../../../lib/legacyRoadmap";

export const runtime = "nodejs";

async function insertRoadmap(projectId: string, roadmap: any[]) {
  const { data: existingStages } = await supabaseServer
    .from("roadmap_stages")
    .select("id")
    .eq("project_id", projectId);
  const stageIds = (existingStages || []).map((row) => row.id);
  if (stageIds.length > 0) {
    const { error: deleteTaskError } = await supabaseServer
      .from("roadmap_tasks")
      .delete()
      .in("stage_row_id", stageIds);
    if (deleteTaskError) throw new Error(deleteTaskError.message);
  }

  const { error: deleteStageError } = await supabaseServer
    .from("roadmap_stages")
    .delete()
    .eq("project_id", projectId);
  if (deleteStageError) throw new Error(deleteStageError.message);

  const stageRows = roadmap.map((stage, index) => ({
    project_id: projectId,
    stage_id: stage.stage_id,
    stage_name: stage.stage_name,
    position: index + 1,
    unlocked: index === 0
  }));

  const { data: insertedStages, error: stageError } = await supabaseServer
    .from("roadmap_stages")
    .insert(stageRows)
    .select("*");
  if (stageError) throw new Error(stageError.message);

  const taskRows = insertedStages.flatMap((stageRow: any) => {
    const stage = roadmap.find((s) => s.stage_id === stageRow.stage_id);
    const weeks = stage?.weeks || [];
    return weeks.flatMap((week: any, weekIndex: number) =>
      (week.tasks || []).map((task: any, taskIndex: number) => ({
        stage_row_id: stageRow.id,
        task_id: task.task_id || `${stageRow.stage_id}-${weekIndex + 1}-${taskIndex + 1}`,
        task: task.task || "Task",
        week: week.week || weekIndex + 1,
        position: taskIndex + 1,
        tools: Array.isArray(week.tools) ? week.tools.join(", ") : "",
        deliverables: Array.isArray(week.deliverables) ? week.deliverables.join(", ") : "",
        completed: false
      }))
    );
  });

  if (taskRows.length) {
    const { error: taskError } = await supabaseServer.from("roadmap_tasks").insert(taskRows);
    if (taskError) throw new Error(taskError.message);
  }
}

export async function POST(req: Request) {
  try {
    const { project_id, user_id } = await req.json();
    let resolvedProjectId: string | null = null;
    let project: any = null;
    let legacyRow: any = null;
    let useLegacy = false;

    if (project_id) {
      const { data, error } = await supabaseServer.from("projects").select("*").eq("id", project_id).maybeSingle();
      if (error) {
        if (isMissingTableError(error, "projects")) {
          useLegacy = true;
        } else {
          throw new Error(error.message);
        }
      } else if (data) {
        project = data;
        resolvedProjectId = data.id;
      }
    }

    if (!project && !useLegacy && user_id) {
      const { data, error } = await supabaseServer
        .from("projects")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) {
        if (isMissingTableError(error, "projects")) {
          useLegacy = true;
        } else {
          throw new Error(error.message);
        }
      } else if (data) {
        project = data;
        resolvedProjectId = data.id;
      }
    }

    if (!project && !useLegacy && user_id) {
      const { data: profile } = await supabaseServer
        .from("startup_profile")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const profileIdea = typeof profile?.idea_sentence === "string" ? profile.idea_sentence.trim() : "";
      const profileName = profileIdea ? profileIdea.slice(0, 40) : "Untitled Startup";

      const { data, error } = await supabaseServer
        .from("projects")
        .insert({
          user_id,
          name: profileName,
          description: profileIdea || "Student startup project",
          domain: profile?.domains || "General",
          stage: profile?.idea_stage || "Ideation",
          team_size: 1,
          demo_built: false,
          target_user_age_range: "14-18",
          timeline_available_weeks: profile?.timeline?.includes("1 month")
            ? 4
            : profile?.timeline?.includes("ASAP")
              ? 2
              : 8,
          goal: profile?.primary_goal || "Build a real product"
        })
        .select("*")
        .single();

      if (error) {
        if (isMissingTableError(error, "projects")) {
          useLegacy = true;
        } else {
          throw new Error(error.message);
        }
      } else if (data) {
        project = data;
        resolvedProjectId = data.id;
      }
    }

    if (!project) {
      useLegacy = true;

      if (project_id) {
        const { data, error } = await supabaseServer
          .from("user_projects")
          .select("*")
          .eq("id", project_id)
          .maybeSingle();
        if (error && !isMissingTableError(error, "user_projects")) throw new Error(error.message);
        if (data) legacyRow = data;
      }

      if (!legacyRow && user_id) {
        const { data, error } = await supabaseServer
          .from("user_projects")
          .select("*")
          .eq("user_id", user_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error && !isMissingTableError(error, "user_projects")) throw new Error(error.message);
        if (data) legacyRow = data;
      }

      if (!legacyRow && user_id) {
        const defaultInput = {
          project_name: "Untitled Startup",
          project_description: "Student startup project",
          domain: "General",
          stage: "Ideation",
          team_size: 1,
          demo_built: false,
          timeline_available_weeks: 8,
          goal: "Build a real product"
        };
        const { data, error } = await supabaseServer
          .from("user_projects")
          .insert({
            user_id,
            project_input: defaultInput,
            idea_rating: {},
            lean_business_plan: {},
            roadmap: [],
            mentor_notes: {},
            summary: "",
            progress: {}
          })
          .select("*")
          .single();
        if (error) throw new Error(error.message);
        legacyRow = data;
      }

      if (!legacyRow) {
        return NextResponse.json({ error: "Missing project context" }, { status: 400 });
      }

      const input = legacyRow.project_input && typeof legacyRow.project_input === "object" ? legacyRow.project_input : {};
      project = {
        id: legacyRow.id,
        user_id: legacyRow.user_id,
        name: input.project_name || "Untitled Startup",
        description: input.project_description || "Student startup project",
        domain: input.domain || "General",
        stage: input.stage || "Ideation",
        team_size: Number(input.team_size) || 1,
        demo_built: Boolean(input.demo_built)
      };
      resolvedProjectId = legacyRow.id;
    }

    let onboarding: any = null;
    if (!useLegacy && resolvedProjectId) {
      const { data } = await supabaseServer
        .from("onboarding_answers")
        .select("*")
        .eq("project_id", resolvedProjectId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      onboarding = data || null;
    } else if (user_id) {
      const { data } = await supabaseServer
        .from("startup_profile")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      onboarding = data || null;
    }

    let progressInput: any = [];
    if (!useLegacy && resolvedProjectId) {
      const { data } = await supabaseServer
        .from("progress_logs")
        .select("entry, results")
        .eq("project_id", resolvedProjectId)
        .order("created_at", { ascending: false })
        .limit(5);
      progressInput = data || [];
    } else {
      progressInput = legacyRow?.progress || {};
    }

    const groq = createGroqClient();
    const aiResponse = await generateRoadmap(groq, {
      project,
      onboarding,
      progress: progressInput
    });
    const roadmap = normalizeRoadmap(aiResponse);

    if (!roadmap.length || !resolvedProjectId) {
      return NextResponse.json({ error: "Roadmap generation returned no stages" }, { status: 500 });
    }

    if (useLegacy) {
      const computedProgress = computeLegacyProgress(roadmap, legacyRow?.progress || {});
      const { error: updateError } = await supabaseServer
        .from("user_projects")
        .update({
          roadmap,
          progress: {
            ...(legacyRow?.progress && typeof legacyRow.progress === "object" ? legacyRow.progress : {}),
            tasks: computedProgress.tasks,
            stages: computedProgress.stages,
            unlockedStages: computedProgress.unlockedStages
          }
        })
        .eq("id", resolvedProjectId);
      if (updateError) throw new Error(updateError.message);
    } else {
      try {
        await insertRoadmap(resolvedProjectId, roadmap);
      } catch (insertError: any) {
        if (
          isMissingTableError(insertError, "roadmap_stages") ||
          isMissingTableError(insertError, "roadmap_tasks")
        ) {
          const computedProgress = computeLegacyProgress(roadmap, {});
          const { error: legacyUpsertError } = await supabaseServer.from("user_projects").upsert(
            {
              id: resolvedProjectId,
              user_id: project?.user_id || user_id || null,
              project_input:
                project && typeof project === "object"
                  ? {
                      project_name: project.name || "Untitled Startup",
                      project_description: project.description || "Student startup project",
                      domain: project.domain || "General",
                      stage: project.stage || "Ideation",
                      team_size: project.team_size || 1,
                      demo_built: Boolean(project.demo_built),
                      generated_project_id: resolvedProjectId
                    }
                  : {},
              roadmap,
              progress: {
                tasks: computedProgress.tasks,
                stages: computedProgress.stages,
                unlockedStages: computedProgress.unlockedStages
              }
            },
            { onConflict: "id" }
          );
          if (legacyUpsertError) throw new Error(legacyUpsertError.message);
        } else {
          throw insertError;
        }
      }
    }

    return NextResponse.json({ roadmap, project_id: resolvedProjectId });
  } catch (err: any) {
    console.error("generate/roadmap failed", err);
    return NextResponse.json({ error: err.message || "Failed to regenerate roadmap" }, { status: 500 });
  }
}
