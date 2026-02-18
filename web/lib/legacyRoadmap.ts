type RawTask = { task_id?: string; task?: string };
type RawWeek = {
  week?: number;
  tasks?: RawTask[];
  tools?: string[] | string;
  deliverables?: string[] | string;
};
type RawStage = {
  stage_id?: string;
  stage_name?: string;
  name?: string;
  unlocked?: boolean;
  weeks?: RawWeek[];
  tasks?: RawTask[];
};

export type NormalizedStage = {
  stage_id: string;
  stage_name: string;
  unlocked?: boolean;
  weeks: Array<{
    week: number;
    tasks: Array<{ task_id: string; task: string }>;
    tools: string[];
    deliverables: string[];
  }>;
};

export function isMissingTableError(error: any, table: string) {
  const message = String(error?.message || "");
  return (
    error?.code === "PGRST205" ||
    message.includes(`public.${table}`) ||
    message.includes(`relation "${table}" does not exist`) ||
    message.includes("schema cache")
  );
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string") as string[];
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}

export function normalizeRoadmap(raw: any): NormalizedStage[] {
  const source: RawStage[] = Array.isArray(raw?.roadmap) ? raw.roadmap : Array.isArray(raw) ? raw : [];

  return source.map((stage, stageIndex) => {
    const stageId = stage.stage_id || `stage-${stageIndex + 1}`;
    const stageName = stage.stage_name || stage.name || `Stage ${stageIndex + 1}`;
    const weeksSource = Array.isArray(stage.weeks)
      ? stage.weeks
      : Array.isArray(stage.tasks)
        ? [{ week: 1, tasks: stage.tasks }]
        : [];

    const weeks = weeksSource.map((week, weekIndex) => {
      const tasks = (Array.isArray(week.tasks) ? week.tasks : []).map((task, taskIndex) => ({
        task_id: task.task_id || `${stageId}-${weekIndex + 1}-${taskIndex + 1}`,
        task: task.task || "Task"
      }));
      return {
        week: typeof week.week === "number" ? week.week : weekIndex + 1,
        tasks,
        tools: asStringArray(week.tools),
        deliverables: asStringArray(week.deliverables)
      };
    });

    return {
      stage_id: stageId,
      stage_name: stageName,
      unlocked: stage.unlocked,
      weeks
    };
  });
}

export function computeLegacyProgress(
  roadmap: NormalizedStage[],
  rawProgress: any
): {
  tasks: Record<string, boolean>;
  stages: Record<string, { completed: boolean }>;
  unlockedStages: Record<string, boolean>;
} {
  const progress = rawProgress && typeof rawProgress === "object" ? rawProgress : {};
  const tasks = progress.tasks && typeof progress.tasks === "object" ? { ...progress.tasks } : {};
  const unlockedStages =
    progress.unlockedStages && typeof progress.unlockedStages === "object" ? { ...progress.unlockedStages } : {};
  const stages: Record<string, { completed: boolean }> = {};

  if (roadmap.length > 0) unlockedStages[roadmap[0].stage_id] = true;

  roadmap.forEach((stage, index) => {
    const taskIds = stage.weeks.flatMap((week) => week.tasks.map((task) => task.task_id));
    const allComplete = taskIds.length > 0 && taskIds.every((taskId) => Boolean(tasks[taskId]));
    stages[stage.stage_id] = { completed: allComplete };
    if (allComplete && roadmap[index + 1]) {
      unlockedStages[roadmap[index + 1].stage_id] = true;
    }
  });

  return { tasks, stages, unlockedStages };
}

export function roadmapToApiStages(roadmap: NormalizedStage[], progressRaw: any) {
  const progress = computeLegacyProgress(roadmap, progressRaw);
  return roadmap.map((stage, stageIndex) => {
    const tasks = stage.weeks.flatMap((week, weekIndex) =>
      week.tasks.map((task, taskIndex) => ({
        id: `${stage.stage_id}-${weekIndex + 1}-${taskIndex + 1}`,
        task_id: task.task_id,
        task: task.task,
        week: week.week,
        position: taskIndex + 1,
        tools: week.tools.join(", "),
        deliverables: week.deliverables.join(", "),
        completed: Boolean(progress.tasks[task.task_id])
      }))
    );

    return {
      id: stage.stage_id,
      stage_id: stage.stage_id,
      stage_name: stage.stage_name,
      position: stageIndex + 1,
      unlocked: stage.unlocked ?? progress.unlockedStages[stage.stage_id] ?? stageIndex === 0,
      tasks
    };
  });
}
