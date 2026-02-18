import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { createGroqClient, generatePlan } from "../../../../lib/groq";
import { computeLegacyProgress, isMissingTableError, normalizeRoadmap } from "../../../../lib/legacyRoadmap";

export const runtime = "nodejs";

async function clearRoadmap(projectId: string) {
  const { data: existingStages, error: stageReadError } = await supabaseServer
    .from("roadmap_stages")
    .select("id")
    .eq("project_id", projectId);
  if (stageReadError) throw new Error(stageReadError.message);

  const stageIds = (existingStages || []).map((row) => row.id);
  if (stageIds.length > 0) {
    const { error: deleteTasksError } = await supabaseServer.from("roadmap_tasks").delete().in("stage_row_id", stageIds);
    if (deleteTasksError) throw new Error(deleteTasksError.message);
  }

  const { error: deleteStagesError } = await supabaseServer.from("roadmap_stages").delete().eq("project_id", projectId);
  if (deleteStagesError) throw new Error(deleteStagesError.message);
}

async function insertRoadmap(projectId: string, roadmap: any[]) {
  await clearRoadmap(projectId);

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

  if (taskRows.length > 0) {
    const { error: taskError } = await supabaseServer.from("roadmap_tasks").insert(taskRows);
    if (taskError) throw new Error(taskError.message);
  }
}

async function safeMarkOnboardingComplete(userId: string) {
  const { error } = await supabaseServer
    .from("users")
    .upsert({ user_id: userId, has_completed_onboarding: true }, { onConflict: "user_id" });
  if (error && !isMissingTableError(error, "users")) throw new Error(error.message);
}

async function upsertLegacyProject(params: {
  userId: string;
  projectInput: any;
  onboarding: any;
  aiResponse: any;
  roadmap: any[];
}) {
  const { userId, projectInput, onboarding, aiResponse, roadmap } = params;
  const computedProgress = computeLegacyProgress(roadmap, {});
  const summaryText = aiResponse.idea_feedback || aiResponse.summary || "";

  const { data: inserted, error } = await supabaseServer
    .from("user_projects")
    .insert({
      user_id: userId,
      project_input: { ...projectInput, onboarding: onboarding || null },
      idea_rating: aiResponse.idea_rating || {},
      lean_business_plan: {
        ...(aiResponse.business_plan || aiResponse.lean_business_plan || {}),
        idea_aspect_feedback: aiResponse.idea_aspect_feedback || []
      },
      roadmap,
      mentor_notes: aiResponse.mentor_summary || aiResponse.mentor_notes || {},
      summary: summaryText,
      progress: {
        tasks: computedProgress.tasks,
        stages: computedProgress.stages,
        unlockedStages: computedProgress.unlockedStages
      }
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return inserted;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, project, onboarding } = body || {};
    if (!user_id || !project) {
      return NextResponse.json({ error: "Missing user_id or project" }, { status: 400 });
    }

    const groq = createGroqClient();
    const aiResponse = await generatePlan(groq, { project, onboarding });
    const roadmap = normalizeRoadmap(aiResponse);
    if (!roadmap.length) {
      return NextResponse.json({ error: "Plan generation returned no roadmap stages" }, { status: 500 });
    }

    let projectRow: any = null;
    let usedLegacy = false;

    const { data: insertedProject, error: projectError } = await supabaseServer
      .from("projects")
      .insert({
        user_id,
        name: project.project_name,
        description: project.project_description,
        domain: project.domain,
        stage: project.stage,
        team_size: project.team_size,
        demo_built: project.demo_built,
        target_user_age_range: Array.isArray(project.target_user_age_range)
          ? project.target_user_age_range.join("-")
          : project.target_user_age_range,
        timeline_available_weeks: project.timeline_available_weeks,
        goal: project.goal
      })
      .select("*")
      .single();

    if (projectError) {
      usedLegacy = true;
    } else {
      projectRow = insertedProject;
    }

    if (usedLegacy) {
      const legacyRow = await upsertLegacyProject({
        userId: user_id,
        projectInput: project,
        onboarding,
        aiResponse,
        roadmap
      });

      if (onboarding) {
        const { error: profileError } = await supabaseServer.from("startup_profile").insert({
          user_id,
          idea_stage: onboarding.ideaStage,
          domains: Array.isArray(onboarding.domains) ? onboarding.domains.join(", ") : onboarding.domains || "",
          primary_goal: onboarding.primaryGoal,
          experience: onboarding.experience,
          timeline: onboarding.timeline,
          idea_sentence: onboarding.ideaSentence
        });
        if (profileError && !isMissingTableError(profileError, "startup_profile")) {
          throw new Error(profileError.message);
        }
      }

      await safeMarkOnboardingComplete(user_id);

      return NextResponse.json({
        project: {
          id: legacyRow.id,
          user_id,
          name: project.project_name,
          domain: project.domain,
          stage: project.stage
        },
        business_plan: aiResponse.business_plan || aiResponse.lean_business_plan,
        mentor_summary: aiResponse.mentor_summary || aiResponse.mentor_notes,
        roadmap
      });
    }

    if (onboarding && projectRow?.id) {
      const { error: onboardingError } = await supabaseServer.from("onboarding_answers").insert({
        user_id,
        project_id: projectRow.id,
        idea_stage: onboarding.ideaStage,
        domains: onboarding.domains || [],
        primary_goal: onboarding.primaryGoal,
        experience: onboarding.experience,
        timeline: onboarding.timeline,
        idea_sentence: onboarding.ideaSentence
      });
      if (onboardingError && !isMissingTableError(onboardingError, "onboarding_answers")) {
        throw new Error(onboardingError.message);
      }
    }

    if (projectRow?.id) {
      const { data: latestPlan, error: latestError } = await supabaseServer
        .from("business_plans")
        .select("version")
        .eq("project_id", projectRow.id)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latestError && !isMissingTableError(latestError, "business_plans")) {
        throw new Error(latestError.message);
      }
      const nextVersion = latestPlan?.version ? latestPlan.version + 1 : 1;

      const { error: planError } = await supabaseServer.from("business_plans").insert({
        project_id: projectRow.id,
        version: nextVersion,
        plan: {
          idea_rating: aiResponse.idea_rating || {},
          idea_rating_details: aiResponse.idea_rating_details || {},
          idea_aspect_feedback: aiResponse.idea_aspect_feedback || [],
          idea_feedback: aiResponse.idea_feedback || "",
          business_plan: aiResponse.business_plan || aiResponse.lean_business_plan || {},
          mentor_summary: aiResponse.mentor_summary || aiResponse.mentor_notes || {},
          summary: aiResponse.summary || ""
        }
      });
      if (planError && !isMissingTableError(planError, "business_plans")) {
        throw new Error(planError.message);
      }

      const probe = await supabaseServer.from("roadmap_stages").select("id").limit(1);
      if (!probe.error) {
        await insertRoadmap(projectRow.id, roadmap);
      } else if (!isMissingTableError(probe.error, "roadmap_stages")) {
        throw new Error(probe.error.message);
      }

      // Write a backup copy for legacy readers if table exists.
      await supabaseServer.from("user_projects").upsert(
        {
          id: projectRow.id,
          user_id,
          project_input: { ...project, onboarding: onboarding || null, generated_project_id: projectRow.id },
          idea_rating: aiResponse.idea_rating || {},
          lean_business_plan: {
            ...(aiResponse.business_plan || aiResponse.lean_business_plan || {}),
            idea_aspect_feedback: aiResponse.idea_aspect_feedback || []
          },
          roadmap,
          mentor_notes: aiResponse.mentor_summary || aiResponse.mentor_notes || {},
          summary: aiResponse.idea_feedback || aiResponse.summary || "",
          progress: computeLegacyProgress(roadmap, {})
        },
        { onConflict: "id" }
      );
    }

    await safeMarkOnboardingComplete(user_id);

    return NextResponse.json({
      project: projectRow,
      business_plan: aiResponse.business_plan || aiResponse.lean_business_plan,
      mentor_summary: aiResponse.mentor_summary || aiResponse.mentor_notes,
      roadmap
    });
  } catch (err: any) {
    console.error("generate/plan failed", err);
    return NextResponse.json({ error: err.message || "Failed to generate plan" }, { status: 500 });
  }
}
