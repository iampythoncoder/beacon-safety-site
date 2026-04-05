import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";
import { computeLegacyProgress, isMissingTableError, normalizeRoadmap } from "../../../lib/legacyRoadmap";

export const runtime = "nodejs";

type NormalizedTask = {
  task_id: string;
  task: string;
  completed: boolean;
  stage_name: string;
  week?: number;
  tools?: string;
  deliverables?: string;
};

type ProgressLog = {
  entry: string;
  links: string;
  results: string;
  created_at: string;
};

const KEYWORDS = {
  submission: [
    "submit",
    "submission",
    "apply",
    "application",
    "pitch",
    "deck",
    "demo",
    "proposal",
    "one-pager",
    "business plan",
    "finalist",
    "winner",
    "won",
    "qualifier"
  ],
  competition: ["competition", "challenge", "deca", "fbla", "isef", "conrad", "olympiad", "science fair", "hackathon"],
  pitch: ["pitch", "deck", "judges", "demo day", "presentation", "elevator pitch"],
  accelerator: ["accelerator", "incubator", "investor", "funding", "venture", "mentor", "yc", "y combinator"],
  technical: [
    "build",
    "code",
    "coding",
    "api",
    "backend",
    "frontend",
    "database",
    "supabase",
    "deploy",
    "vercel",
    "auth",
    "mvp",
    "prototype",
    "integration"
  ],
  validation: [
    "interview",
    "user",
    "customer",
    "feedback",
    "survey",
    "waitlist",
    "pilot",
    "retention",
    "conversion",
    "signup",
    "revenue",
    "traction",
    "kpi",
    "metric",
    "validation"
  ],
  roadmapAccel: ["traction", "growth", "mentor", "investor", "funding", "distribution", "gtm", "go-to-market", "kpi"]
} as const;

function clampScore(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function containsKeyword(text: string, keywords: readonly string[]) {
  const normalized = text.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

function withinDays(dateValue: string, days: number) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;
  const delta = Date.now() - date.getTime();
  return delta >= 0 && delta <= days * 24 * 60 * 60 * 1000;
}

function scoreFromComponents(progressLogs: number, roadmapCompletion: number, userSubmissions: number, weights: [number, number, number]) {
  const raw =
    progressLogs * weights[0] +
    roadmapCompletion * weights[1] +
    userSubmissions * weights[2];
  const smoothed = raw * 0.8 + 18;
  return clampScore(smoothed, 18, 98);
}

function logText(log: ProgressLog) {
  return `${log.entry || ""} ${log.links || ""} ${log.results || ""}`.toLowerCase();
}

function keywordLogStats(logs: ProgressLog[], keywords: readonly string[]) {
  const matches = logs.filter((log) => containsKeyword(logText(log), keywords));
  const recentMatches = matches.filter((log) => withinDays(log.created_at, 30));
  const evidenceMatches = matches.filter((log) => Boolean(String(log.links || "").trim()) || Boolean(String(log.results || "").trim()));
  return {
    count: matches.length,
    score: clampScore(
      (matches.length / Math.max(1, logs.length)) * 100 * 0.5 +
        (recentMatches.length / 6) * 100 * 0.3 +
        (evidenceMatches.length / Math.max(1, matches.length)) * 100 * 0.2
    )
  };
}

function keywordTaskStats(tasks: NormalizedTask[], keywords: readonly string[]) {
  const matches = tasks.filter((task) =>
    containsKeyword(`${task.task || ""} ${task.tools || ""} ${task.deliverables || ""}`.toLowerCase(), keywords)
  );
  const completed = matches.filter((task) => task.completed).length;
  return {
    total: matches.length,
    completed,
    score: matches.length ? clampScore((completed / matches.length) * 100) : 0
  };
}

async function loadRoadmapStats(projectId: string) {
  const { data: stages, error: stageError } = await supabaseServer
    .from("roadmap_stages")
    .select("id, stage_id, stage_name, position, unlocked")
    .eq("project_id", projectId)
    .order("position", { ascending: true });

  const legacyMode = Boolean(stageError && isMissingTableError(stageError, "roadmap_stages"));
  if (stageError && !legacyMode) throw new Error(stageError.message);

  if (!legacyMode && stages && stages.length > 0) {
    const stageIds = stages.map((stage) => stage.id);
    const { data: tasks, error: taskError } = await supabaseServer
      .from("roadmap_tasks")
      .select("stage_row_id, task_id, task, completed, week, tools, deliverables")
      .in("stage_row_id", stageIds.length ? stageIds : ["00000000-0000-0000-0000-000000000000"]);

    const missingTaskTable = Boolean(taskError && isMissingTableError(taskError, "roadmap_tasks"));
    if (taskError && !missingTaskTable) throw new Error(taskError.message);

    if (!missingTaskTable) {
      const stageNameById = new Map(stages.map((stage) => [stage.id, stage.stage_name]));
      const normalizedTasks: NormalizedTask[] = (tasks || []).map((task) => ({
        task_id: String(task.task_id || ""),
        task: String(task.task || ""),
        completed: Boolean(task.completed),
        stage_name: String(stageNameById.get(task.stage_row_id) || "Stage"),
        week: typeof task.week === "number" ? task.week : undefined,
        tools: String(task.tools || ""),
        deliverables: String(task.deliverables || "")
      }));

      const totalTasks = normalizedTasks.length;
      const completedTasks = normalizedTasks.filter((task) => task.completed).length;
      return {
        tasks: normalizedTasks,
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        completion_pct: totalTasks ? clampScore((completedTasks / totalTasks) * 100) : 0,
        total_stages: stages.length,
        unlocked_stages: stages.filter((stage) => stage.unlocked).length
      };
    }
  }

  const { data: legacy, error: legacyError } = await supabaseServer
    .from("user_projects")
    .select("roadmap, progress")
    .eq("id", projectId)
    .maybeSingle();
  if (legacyError) throw new Error(legacyError.message);

  const normalizedRoadmap = normalizeRoadmap(legacy?.roadmap);
  const legacyProgress = computeLegacyProgress(normalizedRoadmap, legacy?.progress || {});
  const normalizedTasks: NormalizedTask[] = normalizedRoadmap.flatMap((stage) =>
    stage.weeks.flatMap((week) =>
      week.tasks.map((task) => ({
        task_id: task.task_id,
        task: task.task,
        completed: Boolean(legacyProgress.tasks[task.task_id]),
        stage_name: stage.stage_name,
        week: week.week,
        tools: week.tools.join(", "),
        deliverables: week.deliverables.join(", ")
      }))
    )
  );
  const totalTasks = normalizedTasks.length;
  const completedTasks = normalizedTasks.filter((task) => task.completed).length;
  const unlockedStages = normalizedRoadmap.filter((stage, index) =>
    Boolean(legacyProgress.unlockedStages[stage.stage_id]) || index === 0
  ).length;
  return {
    tasks: normalizedTasks,
    total_tasks: totalTasks,
    completed_tasks: completedTasks,
    completion_pct: totalTasks ? clampScore((completedTasks / totalTasks) * 100) : 0,
    total_stages: normalizedRoadmap.length,
    unlocked_stages: unlockedStages
  };
}

async function loadProgressLogs(projectId: string) {
  const { data, error } = await supabaseServer
    .from("progress_logs")
    .select("entry, links, results, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(250);

  const missingProgressLogs = Boolean(error && isMissingTableError(error, "progress_logs"));
  if (error && !missingProgressLogs) throw new Error(error.message);

  if (!missingProgressLogs) {
    return (data || []).map((row) => ({
      entry: String(row.entry || ""),
      links: String(row.links || ""),
      results: String(row.results || ""),
      created_at: String(row.created_at || new Date().toISOString())
    })) as ProgressLog[];
  }

  const { data: legacy, error: legacyError } = await supabaseServer
    .from("user_projects")
    .select("progress")
    .eq("id", projectId)
    .maybeSingle();
  if (legacyError) throw new Error(legacyError.message);

  const rawLogs = Array.isArray(legacy?.progress?.logs) ? legacy.progress.logs : [];
  return rawLogs.map((log: any) => ({
    entry: String(log?.entry || ""),
    links: String(log?.links || ""),
    results: String(log?.results || ""),
    created_at: String(log?.created_at || new Date().toISOString())
  })) as ProgressLog[];
}

async function loadPlanVersionCount(projectId: string) {
  const { data, error } = await supabaseServer
    .from("business_plans")
    .select("id")
    .eq("project_id", projectId)
    .limit(50);

  const missingPlans = Boolean(error && isMissingTableError(error, "business_plans"));
  if (error && !missingPlans) throw new Error(error.message);
  if (!missingPlans) return (data || []).length;

  const { data: legacy, error: legacyError } = await supabaseServer
    .from("user_projects")
    .select("lean_business_plan")
    .eq("id", projectId)
    .maybeSingle();
  if (legacyError) throw new Error(legacyError.message);
  return legacy?.lean_business_plan ? 1 : 0;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("project_id");
    if (!projectId) {
      return NextResponse.json({ error: "Missing project_id" }, { status: 400 });
    }

    const [roadmapStats, progressLogs, planVersions] = await Promise.all([
      loadRoadmapStats(projectId),
      loadProgressLogs(projectId),
      loadPlanVersionCount(projectId)
    ]);

    const totalLogs = progressLogs.length;
    const logsWithLinks = progressLogs.filter((log) => Boolean(log.links.trim())).length;
    const logsWithResults = progressLogs.filter((log) => Boolean(log.results.trim())).length;
    const logsLast30Days = progressLogs.filter((log) => withinDays(log.created_at, 30)).length;

    const logCadenceScore = clampScore((logsLast30Days / 8) * 100);
    const logVolumeScore = clampScore((totalLogs / 24) * 100);
    const logEvidenceScore = clampScore(((logsWithLinks + logsWithResults) / Math.max(1, totalLogs * 2)) * 100);
    const progressSignal = clampScore(logCadenceScore * 0.5 + logEvidenceScore * 0.3 + logVolumeScore * 0.2);

    const stageUnlockPct = roadmapStats.total_stages
      ? clampScore((roadmapStats.unlocked_stages / roadmapStats.total_stages) * 100)
      : 0;
    const roadmapSignal = clampScore(roadmapStats.completion_pct * 0.72 + stageUnlockPct * 0.28);

    const submissionLogStats = keywordLogStats(progressLogs, KEYWORDS.submission);
    const submissionTaskStats = keywordTaskStats(roadmapStats.tasks, KEYWORDS.submission);
    const submissionTaskScore =
      submissionTaskStats.total > 0 ? submissionTaskStats.score : clampScore(roadmapStats.completion_pct * 0.55);
    const planVersionScore = clampScore(planVersions * 26, 0, 100);
    const artifactScore = clampScore(planVersionScore * 0.5 + logsWithLinks * 5 + logsWithResults * 4);
    const submissionSignal = clampScore(
      submissionLogStats.score * 0.42 +
        submissionTaskScore * 0.33 +
        artifactScore * 0.25
    );

    const competitionProgress = clampScore(
      average([progressSignal, keywordLogStats(progressLogs, KEYWORDS.competition).score, keywordLogStats(progressLogs, KEYWORDS.validation).score])
    );
    const competitionRoadmap = clampScore(
      average([roadmapSignal, keywordTaskStats(roadmapStats.tasks, KEYWORDS.competition).score, keywordTaskStats(roadmapStats.tasks, KEYWORDS.pitch).score])
    );
    const competitionSubmissions = clampScore(
      average([submissionSignal, keywordLogStats(progressLogs, KEYWORDS.competition).score, submissionTaskScore])
    );

    const pitchProgress = clampScore(average([progressSignal, keywordLogStats(progressLogs, KEYWORDS.pitch).score]));
    const pitchRoadmap = clampScore(average([roadmapSignal, keywordTaskStats(roadmapStats.tasks, KEYWORDS.pitch).score]));
    const pitchSubmissions = clampScore(
      average([submissionSignal, keywordLogStats(progressLogs, KEYWORDS.pitch).score, submissionTaskScore])
    );

    const acceleratorProgress = clampScore(
      average([progressSignal, keywordLogStats(progressLogs, KEYWORDS.accelerator).score, keywordLogStats(progressLogs, KEYWORDS.validation).score])
    );
    const acceleratorRoadmap = clampScore(
      average([roadmapSignal, keywordTaskStats(roadmapStats.tasks, KEYWORDS.roadmapAccel).score])
    );
    const acceleratorSubmissions = clampScore(
      average([submissionSignal, planVersionScore, keywordLogStats(progressLogs, KEYWORDS.accelerator).score])
    );

    const technicalProgress = clampScore(average([progressSignal, keywordLogStats(progressLogs, KEYWORDS.technical).score]));
    const technicalRoadmap = clampScore(average([roadmapSignal, keywordTaskStats(roadmapStats.tasks, KEYWORDS.technical).score]));
    const technicalSubmissions = clampScore(
      average([submissionSignal, keywordLogStats(progressLogs, KEYWORDS.technical).score, logsWithLinks > 0 ? 70 : 20])
    );

    const validationProgress = clampScore(average([progressSignal, keywordLogStats(progressLogs, KEYWORDS.validation).score]));
    const validationRoadmap = clampScore(average([roadmapSignal, keywordTaskStats(roadmapStats.tasks, KEYWORDS.validation).score]));
    const validationSubmissions = clampScore(
      average([submissionSignal, keywordLogStats(progressLogs, KEYWORDS.validation).score, logsWithResults > 0 ? 72 : 18])
    );

    const scores = [
      {
        id: "competition_readiness",
        label: "Competition-readiness score",
        score: scoreFromComponents(competitionProgress, competitionRoadmap, competitionSubmissions, [0.33, 0.32, 0.35]),
        components: {
          progress_logs: competitionProgress,
          roadmap_completion: competitionRoadmap,
          user_submissions: competitionSubmissions
        },
        rationale: "Emphasizes competition-oriented progress evidence, relevant roadmap tasks, and submission artifacts."
      },
      {
        id: "pitch_readiness",
        label: "Pitch-readiness score",
        score: scoreFromComponents(pitchProgress, pitchRoadmap, pitchSubmissions, [0.34, 0.28, 0.38]),
        components: {
          progress_logs: pitchProgress,
          roadmap_completion: pitchRoadmap,
          user_submissions: pitchSubmissions
        },
        rationale: "Emphasizes pitch communication progress, pitch-task completion, and deck/demo submission evidence."
      },
      {
        id: "accelerator_readiness",
        label: "Accelerator-readiness score",
        score: scoreFromComponents(acceleratorProgress, acceleratorRoadmap, acceleratorSubmissions, [0.36, 0.29, 0.35]),
        components: {
          progress_logs: acceleratorProgress,
          roadmap_completion: acceleratorRoadmap,
          user_submissions: acceleratorSubmissions
        },
        rationale: "Emphasizes execution consistency, traction-related roadmap completion, and investor/accelerator submission signals."
      },
      {
        id: "technical_depth",
        label: "Technical depth score",
        score: scoreFromComponents(technicalProgress, technicalRoadmap, technicalSubmissions, [0.3, 0.48, 0.22]),
        components: {
          progress_logs: technicalProgress,
          roadmap_completion: technicalRoadmap,
          user_submissions: technicalSubmissions
        },
        rationale: "Emphasizes completion of technical roadmap tasks plus technical execution evidence in logs and artifacts."
      },
      {
        id: "market_validation",
        label: "Market validation score",
        score: scoreFromComponents(validationProgress, validationRoadmap, validationSubmissions, [0.42, 0.33, 0.25]),
        components: {
          progress_logs: validationProgress,
          roadmap_completion: validationRoadmap,
          user_submissions: validationSubmissions
        },
        rationale: "Emphasizes interviews, user proof, and validation outcomes logged over time and tied to completed tasks."
      }
    ];

    return NextResponse.json({
      scores,
      inputs: {
        progress_logs: {
          total: totalLogs,
          last_30_days: logsLast30Days,
          with_links: logsWithLinks,
          with_results: logsWithResults,
          signal: progressSignal
        },
        roadmap_completion: {
          total_tasks: roadmapStats.total_tasks,
          completed_tasks: roadmapStats.completed_tasks,
          completion_pct: roadmapStats.completion_pct,
          unlocked_stages: roadmapStats.unlocked_stages,
          total_stages: roadmapStats.total_stages,
          signal: roadmapSignal
        },
        user_submissions: {
          submission_logs: submissionLogStats.count,
          submission_tasks_completed: submissionTaskStats.completed,
          submission_tasks_total: submissionTaskStats.total,
          business_plan_versions: planVersions,
          signal: submissionSignal
        }
      },
      updated_at: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to compute readiness scores" }, { status: 500 });
  }
}
