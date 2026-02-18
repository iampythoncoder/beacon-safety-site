"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

type StageTask = {
  id: string;
  task_id: string;
  task: string;
  completed: boolean;
  week?: number;
  tools?: string;
  deliverables?: string;
};

type Stage = {
  id: string;
  stage_name: string;
  unlocked: boolean;
  tasks: StageTask[];
};

type ProjectProfile = {
  id: string;
  name?: string;
  description?: string;
  domain?: string;
  stage?: string;
  goal?: string;
  team_size?: number;
  timeline_available_weeks?: number;
  demo_built?: boolean;
};

type OnboardingAnswers = {
  idea_stage?: string;
  domains?: string[] | string;
  primary_goal?: string;
  experience?: string;
  timeline?: string;
  idea_sentence?: string;
};

type Resource = {
  title: string;
  type: "Video" | "Course" | "Guide" | "Template";
  url: string;
  tags: string[];
};

type ViewMode = "stages" | "board";
type TaskStatusFilter = "all" | "pending" | "completed";

const roadmapResources: Resource[] = [
  { title: "Y Combinator Startup School", type: "Course", url: "https://www.startupschool.org", tags: ["validation", "mvp", "pitch", "growth"] },
  { title: "How to Start a Startup (Stanford)", type: "Video", url: "https://www.youtube.com/playlist?list=PL5q_lef6zVkaTY_cT1k7qFNF2TidHCe-1", tags: ["pitch", "market", "fundraising", "team"] },
  { title: "Paul Graham: Do Things That Don't Scale", type: "Guide", url: "https://paulgraham.com/ds.html", tags: ["validation", "growth", "users"] },
  { title: "Google UX Research Guide", type: "Guide", url: "https://design.google/library/ux-research-cheat-sheet", tags: ["interview", "validation", "user"] },
  { title: "Supabase Starter Guide", type: "Guide", url: "https://supabase.com/docs/guides/getting-started", tags: ["database", "backend", "auth"] },
  { title: "Vercel Deployment Docs", type: "Guide", url: "https://vercel.com/docs/deployments/overview", tags: ["deploy", "website", "launch"] },
  { title: "Notion PRD Template", type: "Template", url: "https://www.notion.so/templates/product-requirements-doc", tags: ["planning", "roadmap", "deliverable"] },
  { title: "Figma to Product Workflow", type: "Video", url: "https://www.youtube.com/watch?v=FTFaQWZBqQ8", tags: ["design", "mvp", "prototype"] },
  { title: "Cold Outreach Playbook", type: "Guide", url: "https://www.ycombinator.com/library/6f-how-to-talk-to-users", tags: ["interview", "users", "traction"] },
  { title: "Reddit Marketing 101", type: "Guide", url: "https://www.redditinc.com/advertising", tags: ["marketing", "traffic", "launch"] },
  { title: "Canva Pitch Deck Crash Course", type: "Video", url: "https://www.canva.com/designschool/tutorials/presentations/", tags: ["pitch", "deck", "story"] },
  { title: "Founder Institute: MVP Toolkit", type: "Course", url: "https://fi.co/insight", tags: ["mvp", "prototype", "build"] },
  { title: "Product Hunt Launch Checklist", type: "Template", url: "https://www.producthunt.com/launch-checklist", tags: ["launch", "marketing", "growth"] },
  { title: "Coursera: Entrepreneurship Strategy", type: "Course", url: "https://www.coursera.org/learn/entrepreneurship-strategy", tags: ["strategy", "market", "planning"] }
];

function scoreResource(task: StageTask, resource: Resource) {
  const haystack = `${task.task} ${task.tools || ""} ${task.deliverables || ""}`.toLowerCase();
  return resource.tags.reduce((score, tag) => (haystack.includes(tag) ? score + 1 : score), 0);
}

function getTaskResources(task: StageTask) {
  return roadmapResources
    .map((resource) => ({ resource, score: scoreResource(task, resource) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((entry) => entry.resource);
}

function makeExecutionSteps(task: StageTask) {
  const tools = (task.tools || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const deliverables = (task.deliverables || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return [
    `Define a strict output for "${task.task}" in one sentence.`,
    tools.length > 0
      ? `Set up your stack first: ${tools.join(", ")}.`
      : "Set up a lightweight stack first (planning + backend + deployment).",
    "Ship a first version fast and collect direct feedback from real users.",
    deliverables.length > 0
      ? `Finalize proof artifacts: ${deliverables.join(", ")}.`
      : "Capture proof artifacts and the immediate next milestone."
  ];
}

function normalizeDomains(domains: OnboardingAnswers["domains"]) {
  if (Array.isArray(domains)) return domains.join(", ");
  return domains || "";
}

function buildTailoredSteps(task: StageTask, project: ProjectProfile | null, onboarding: OnboardingAnswers | null) {
  const projectName = project?.name || "your startup";
  const domain = project?.domain || onboarding?.idea_stage || "your domain";
  const stage = project?.stage || onboarding?.idea_stage || "current stage";
  const goal = project?.goal || onboarding?.primary_goal || "execution progress";
  const ideaSentence = onboarding?.idea_sentence?.trim();
  const tools = (task.tools || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const deliverables = (task.deliverables || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return [
    `Anchor this task to ${projectName}: define one measurable output tied to your goal (${goal}).`,
    ideaSentence
      ? `Use your idea sentence as a constraint: "${ideaSentence.slice(0, 120)}${ideaSentence.length > 120 ? "..." : ""}".`
      : `Keep the scope narrow for ${domain} founders at the ${stage} stage.`,
    tools.length
      ? `Execute using this stack first: ${tools.join(", ")}.`
      : "Pick one build tool, one data tool, and one tracking tool before you start.",
    deliverables.length
      ? `Finish only when these artifacts exist: ${deliverables.join(", ")}.`
      : "Finish with clear proof artifacts: screenshot, link, metric, and next milestone."
  ];
}

function buildTaskOutcome(task: StageTask, project: ProjectProfile | null, onboarding: OnboardingAnswers | null) {
  const baseGoal = project?.goal || onboarding?.primary_goal || "startup progress";
  const domain = project?.domain || normalizeDomains(onboarding?.domains) || "your domain";
  return {
    successSignal: `Within 7 days, this task should produce a visible signal for ${baseGoal.toLowerCase()}.`,
    riskCheck: `Risk to avoid: shipping activity without evidence in ${domain}. Capture one hard metric after completion.`,
    proofArtifact:
      task.deliverables?.trim() || "Proof artifact: shareable doc, shipped link, and one metric snapshot."
  };
}

function buildToolSuggestions(task: StageTask, project: ProjectProfile | null, onboarding: OnboardingAnswers | null) {
  const domainText = `${project?.domain || ""} ${normalizeDomains(onboarding?.domains)}`.toLowerCase();
  const exp = (onboarding?.experience || "").toLowerCase();
  const defaultTools = (task.tools || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const suggested = new Set(defaultTools);

  suggested.add("Notion");
  suggested.add("Supabase");

  if (domainText.includes("ai")) suggested.add("OpenAI");
  if (domainText.includes("hardware")) suggested.add("Arduino");
  if (domainText.includes("education")) suggested.add("Google Classroom");
  if (exp.includes("no coding")) {
    suggested.add("Lovable");
    suggested.add("Bolt");
  } else {
    suggested.add("Vercel");
    suggested.add("GitHub");
  }

  return Array.from(suggested).slice(0, 8);
}

function taskStorageKey(projectId: string, suffix: string) {
  return `launchlab:roadmap:${projectId}:${suffix}`;
}

export default function RoadmapPage() {
  const [userId, setUserId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [projectProfile, setProjectProfile] = useState<ProjectProfile | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingAnswers | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTaskKey, setActiveTaskKey] = useState<string>("");

  const [viewMode, setViewMode] = useState<ViewMode>("stages");
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>("all");
  const [query, setQuery] = useState("");
  const [focusMode, setFocusMode] = useState(false);
  const [collapsedStages, setCollapsedStages] = useState<Record<string, boolean>>({});
  const [taskNotes, setTaskNotes] = useState<Record<string, string>>({});
  const [taskConfidence, setTaskConfidence] = useState<Record<string, number>>({});

  useEffect(() => {
    async function load() {
      const session = await supabase.auth.getSession();
      const sessionUserId = session.data.session?.user?.id;
      if (!sessionUserId) {
        setError("Please log in again.");
        return;
      }
      setUserId(sessionUserId);
      const projectRes = await fetch(`/api/projects/latest?user_id=${sessionUserId}`);
      if (!projectRes.ok) {
        const data = await projectRes.json().catch(() => ({}));
        setError(data?.error || "Failed to load project.");
        return;
      }
      const project = await projectRes.json();
      if (!project?.id) {
        setError("No project found yet. Regenerate to create your roadmap.");
        return;
      }
      setProjectId(project.id);
      setProjectProfile(project as ProjectProfile);
      const onboardingRes = await fetch(`/api/onboarding/answers?project_id=${project.id}&user_id=${sessionUserId}`);
      if (onboardingRes.ok) {
        const onboardingData = await onboardingRes.json();
        setOnboarding(onboardingData || null);
      }
      await refresh(project.id);
    }
    load();
  }, []);

  useEffect(() => {
    if (!projectId) return;
    const notesRaw = window.localStorage.getItem(taskStorageKey(projectId, "notes"));
    const confidenceRaw = window.localStorage.getItem(taskStorageKey(projectId, "confidence"));
    const collapsedRaw = window.localStorage.getItem(taskStorageKey(projectId, "collapsed"));
    if (notesRaw) setTaskNotes(JSON.parse(notesRaw));
    if (confidenceRaw) setTaskConfidence(JSON.parse(confidenceRaw));
    if (collapsedRaw) setCollapsedStages(JSON.parse(collapsedRaw));
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    window.localStorage.setItem(taskStorageKey(projectId, "notes"), JSON.stringify(taskNotes));
  }, [taskNotes, projectId]);

  useEffect(() => {
    if (!projectId) return;
    window.localStorage.setItem(taskStorageKey(projectId, "confidence"), JSON.stringify(taskConfidence));
  }, [taskConfidence, projectId]);

  useEffect(() => {
    if (!projectId) return;
    window.localStorage.setItem(taskStorageKey(projectId, "collapsed"), JSON.stringify(collapsedStages));
  }, [collapsedStages, projectId]);

  async function refresh(id: string) {
    const res = await fetch(`/api/roadmap?project_id=${id}`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error || "Failed to load roadmap");
      return;
    }
    const data = await res.json();
    setStages(data || []);
  }

  async function toggleTask(stageRowId: string, taskId: string, completed: boolean) {
    await fetch("/api/progress/completeTask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage_row_id: stageRowId, task_id: taskId, project_id: projectId, completed })
    });
    await refresh(projectId);
  }

  async function regenerate() {
    if (!projectId && !userId) {
      setError("Missing user session. Please log in again.");
      return;
    }
    setLoading(true);
    setError("");
    const res = await fetch("/api/generate/roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId || null, user_id: userId || null })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error || "Failed to regenerate roadmap");
      setLoading(false);
      return;
    }
    const payload = await res.json().catch(() => ({}));
    const nextProjectId = payload?.project_id || projectId;
    if (nextProjectId && nextProjectId !== projectId) {
      setProjectId(nextProjectId);
    }
    await refresh(nextProjectId);
    setLoading(false);
  }

  const allTasks = useMemo(
    () =>
      stages.flatMap((stage) =>
        (stage.tasks || []).map((task) => ({
          ...task,
          stageId: stage.id,
          stageName: stage.stage_name,
          unlocked: stage.unlocked,
          taskKey: `${stage.id}:${task.task_id}`
        }))
      ),
    [stages]
  );

  const taskPassesFilters = (task: {
    task: string;
    completed: boolean;
    tools?: string;
    deliverables?: string;
    unlocked: boolean;
  }) => {
    const text = `${task.task} ${task.tools || ""} ${task.deliverables || ""}`.toLowerCase();
    const queryMatch = !query || text.includes(query.toLowerCase());
    const statusMatch =
      statusFilter === "all" || (statusFilter === "pending" ? !task.completed : task.completed);
    const focusMatch = !focusMode || task.unlocked;
    return queryMatch && statusMatch && focusMatch;
  };

  const filteredStages = useMemo(() => {
    return stages.map((stage) => ({
      ...stage,
      tasks: (stage.tasks || []).filter((task) =>
        taskPassesFilters({ ...task, unlocked: stage.unlocked })
      )
    }));
  }, [stages, query, statusFilter, focusMode]);

  const visibleTasks = useMemo(
    () =>
      filteredStages.flatMap((stage) =>
        (stage.tasks || []).map((task) => ({
          ...task,
          stageId: stage.id,
          stageName: stage.stage_name,
          unlocked: stage.unlocked,
          taskKey: `${stage.id}:${task.task_id}`
        }))
      ),
    [filteredStages]
  );

  const completedTasks = useMemo(() => allTasks.filter((task) => task.completed).length, [allTasks]);
  const progress = allTasks.length ? Math.round((completedTasks / allTasks.length) * 100) : 0;

  const nextQueue = useMemo(
    () => allTasks.filter((task) => !task.completed && task.unlocked).slice(0, 6),
    [allTasks]
  );

  const boardColumns = useMemo(
    () => ({
      todo: visibleTasks.filter((task) => task.unlocked && !task.completed),
      done: visibleTasks.filter((task) => task.completed),
      locked: visibleTasks.filter((task) => !task.unlocked && !task.completed)
    }),
    [visibleTasks]
  );

  const activeTask = useMemo(() => {
    if (!activeTaskKey) return null;
    return allTasks.find((task) => task.taskKey === activeTaskKey) || null;
  }, [activeTaskKey, allTasks]);

  useEffect(() => {
    if (activeTaskKey) return;
    const firstPending = allTasks.find((task) => task.unlocked && !task.completed);
    if (firstPending) setActiveTaskKey(firstPending.taskKey);
  }, [allTasks, activeTaskKey]);

  const activeResources = activeTask ? getTaskResources(activeTask) : roadmapResources.slice(0, 5);
  const tailoredSteps = activeTask ? buildTailoredSteps(activeTask, projectProfile, onboarding) : [];
  const taskOutcome = activeTask ? buildTaskOutcome(activeTask, projectProfile, onboarding) : null;
  const suggestedTools = activeTask ? buildToolSuggestions(activeTask, projectProfile, onboarding) : [];

  return (
    <div className="os-page space-y-6">
      <section className="card p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-black/45">Roadmap Engine</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">Interactive Founder Roadmap</h2>
            <p className="mt-3 text-black/65 max-w-2xl">
              Tailored to your project context with detailed execution steps, tool guidance, proof artifacts, and
              progress-driven updates.
            </p>
          </div>
          <button className="px-5 py-2.5 rounded-full bg-ink text-white text-sm" onClick={regenerate} disabled={loading}>
            {loading ? "Regenerating…" : "Regenerate roadmap"}
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-black/10 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-black/45">Completion</p>
            <p className="mt-2 text-3xl font-semibold">{progress}%</p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-black/45">Visible tasks</p>
            <p className="mt-2 text-3xl font-semibold">{visibleTasks.length}</p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-black/45">Next queue</p>
            <p className="mt-2 text-3xl font-semibold">{nextQueue.length}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
          <input
            className="rounded-2xl border border-black/10 bg-white/82 px-4 py-3 text-sm"
            placeholder="Search roadmap tasks"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select
            className="rounded-2xl border border-black/10 bg-white/82 px-4 py-3 text-sm"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as TaskStatusFilter)}
          >
            <option value="all">All tasks</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
          <select
            className="rounded-2xl border border-black/10 bg-white/82 px-4 py-3 text-sm"
            value={viewMode}
            onChange={(event) => setViewMode(event.target.value as ViewMode)}
          >
            <option value="stages">Stage view</option>
            <option value="board">Board view</option>
          </select>
          <label className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white/82 px-4 py-3 text-sm">
            <input type="checkbox" checked={focusMode} onChange={(event) => setFocusMode(event.target.checked)} />
            Focus unlocked
          </label>
        </div>

        <div className="mt-4 rounded-2xl border border-black/10 bg-white/82 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-black/45">Tailoring Inputs</p>
          <p className="mt-2 text-sm text-black/72">
            {(projectProfile?.name || "Project")} · {projectProfile?.domain || "General"} ·{" "}
            {projectProfile?.stage || "Ideation"} · Goal: {projectProfile?.goal || onboarding?.primary_goal || "Build a real product"}
          </p>
          <p className="mt-1 text-xs text-black/56">
            Timeline: {projectProfile?.timeline_available_weeks || "8"} weeks · Team size: {projectProfile?.team_size || 1}
            {onboarding?.experience ? ` · Experience: ${onboarding.experience}` : ""}
            {onboarding?.timeline ? ` · Desired pace: ${onboarding.timeline}` : ""}
          </p>
        </div>
      </section>

      {error && <div className="text-sm text-red-500">{error}</div>}

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          {stages.length === 0 ? (
            <div className="card p-6 text-sm text-black/60">No roadmap yet. Generate one to get started.</div>
          ) : viewMode === "stages" ? (
            filteredStages.map((stage, index) => {
              const collapsed = collapsedStages[stage.id];
              const total = (stage.tasks || []).length;
              const done = (stage.tasks || []).filter((task) => task.completed).length;
              const pct = total ? Math.round((done / total) * 100) : 0;
              return (
                <div key={stage.id} className={`card p-6 ${!stage.unlocked ? "opacity-60" : ""}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-black/45">Stage {index + 1}</p>
                      <h3 className="mt-2 text-2xl font-semibold">{stage.stage_name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] uppercase tracking-[0.2em] ${
                          stage.unlocked ? "bg-black text-white" : "bg-black/10 text-black/50"
                        }`}
                      >
                        {stage.unlocked ? "Unlocked" : "Locked"}
                      </span>
                      <button
                        className="px-3 py-1 rounded-full border border-black/10 text-xs"
                        onClick={() =>
                          setCollapsedStages((prev) => ({ ...prev, [stage.id]: !prev[stage.id] }))
                        }
                      >
                        {collapsed ? "Expand" : "Collapse"}
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-black/10 overflow-hidden">
                    <span className="block h-full bg-black" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-black/55">{pct}% complete in filtered view</p>

                  {!collapsed && (
                    <div className="mt-4 grid gap-3">
                      {(stage.tasks || []).length === 0 ? (
                        <p className="text-sm text-black/55">No tasks in this stage for current filters.</p>
                      ) : (
                        stage.tasks.map((task) => {
                          const taskKey = `${stage.id}:${task.task_id}`;
                          const isActive = taskKey === activeTaskKey;
                          return (
                            <button
                              key={task.id}
                              type="button"
                              onClick={() => setActiveTaskKey((prev) => (prev === taskKey ? "" : taskKey))}
                              className={`text-left rounded-2xl border p-4 transition ${
                                isActive ? "border-black/25 bg-white shadow-md" : "border-black/10 bg-white/75"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  checked={task.completed}
                                  disabled={!stage.unlocked}
                                  onChange={(event) => toggleTask(stage.id, task.task_id, event.target.checked)}
                                  onClick={(event) => event.stopPropagation()}
                                  className="mt-1"
                                />
                                <div className="flex-1">
                                  <div className="flex items-start justify-between gap-4">
                                    <p className={`text-sm ${task.completed ? "line-through text-black/45" : "font-medium text-black/82"}`}>
                                      {task.task}
                                    </p>
                                    <span className="text-[11px] uppercase tracking-[0.2em] text-black/45">Week {task.week || 1}</span>
                                  </div>
                                  <p className="mt-2 text-xs text-black/55">
                                    {isActive ? "Deep dive open on the right." : "Click for execution details."}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { key: "todo", label: "Todo", items: boardColumns.todo },
                { key: "done", label: "Done", items: boardColumns.done },
                { key: "locked", label: "Locked", items: boardColumns.locked }
              ].map((column) => (
                <div key={column.key} className="card p-4 space-y-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-black/45">{column.label} ({column.items.length})</p>
                  <div className="space-y-2 max-h-[560px] overflow-auto pr-1">
                    {column.items.length === 0 ? (
                      <p className="text-xs text-black/55">No tasks</p>
                    ) : (
                      column.items.map((task) => (
                        <button
                          key={task.taskKey}
                          className="w-full text-left rounded-xl border border-black/10 bg-white/85 px-3 py-3"
                          onClick={() => setActiveTaskKey(task.taskKey)}
                        >
                          <p className="text-sm font-medium">{task.task}</p>
                          <p className="mt-1 text-[11px] text-black/55">{task.stageName} · Week {task.week || 1}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-black/45">Focus Queue</p>
            <div className="mt-3 space-y-2">
              {nextQueue.length === 0 ? (
                <p className="text-sm text-black/55">No pending unlocked tasks.</p>
              ) : (
                nextQueue.map((task, index) => (
                  <button
                    key={task.taskKey}
                    className="w-full text-left rounded-xl border border-black/10 bg-white/82 px-3 py-2"
                    onClick={() => setActiveTaskKey(task.taskKey)}
                  >
                    <p className="text-[11px] uppercase tracking-[0.2em] text-black/45">Next {index + 1}</p>
                    <p className="text-sm text-black/78">{task.task}</p>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="card p-6 sticky top-24">
            <p className="text-xs uppercase tracking-[0.3em] text-black/45">Task Deep Dive</p>
            {!activeTask ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-black/65">
                  Select a roadmap task to open execution instructions, tools, deliverables, resources, and personal notes.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-black/10 bg-white/80 p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-black/45">{activeTask.stageName}</p>
                  <h3 className="mt-2 text-lg font-semibold">{activeTask.task}</h3>
                  <p className="mt-2 text-xs text-black/55">Week {activeTask.week || 1}</p>
                  <p className="mt-2 text-xs text-black/58">
                    Context: {projectProfile?.domain || "General"} · {projectProfile?.stage || "Ideation"} · Goal:{" "}
                    {projectProfile?.goal || onboarding?.primary_goal || "Build a real product"}
                  </p>
                </div>

                <div className="rounded-2xl border border-black/10 bg-white/80 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-black/45">Project-tailored execution steps</p>
                  <ol className="mt-3 space-y-2 text-sm text-black/78 list-decimal pl-4">
                    {tailoredSteps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </div>

                {taskOutcome && (
                  <div className="rounded-2xl border border-black/10 bg-white/80 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-black/45">Success criteria</p>
                    <div className="mt-3 space-y-2 text-sm text-black/76">
                      <p>{taskOutcome.successSignal}</p>
                      <p>{taskOutcome.riskCheck}</p>
                      <p>{taskOutcome.proofArtifact}</p>
                    </div>
                    {activeTask.deliverables && (
                      <p className="mt-3 text-xs text-black/60">
                        <span className="font-semibold text-black/75">Deliverables:</span> {activeTask.deliverables}
                      </p>
                    )}
                  </div>
                )}

                <div className="rounded-2xl border border-black/10 bg-white/80 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-black/45">Suggested tool stack</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {suggestedTools.map((tool) => (
                      <span key={tool} className="px-2.5 py-1 rounded-full bg-black/8 text-xs">
                        {tool}
                      </span>
                    ))}
                  </div>
                  {activeTask.tools && (
                    <p className="mt-3 text-xs text-black/60">
                      <span className="font-semibold text-black/75">Roadmap tools:</span> {activeTask.tools}
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-black/10 bg-white/80 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-black/45">Execution confidence</p>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={taskConfidence[activeTask.taskKey] ?? 65}
                    onChange={(event) =>
                      setTaskConfidence((prev) => ({
                        ...prev,
                        [activeTask.taskKey]: Number(event.target.value)
                      }))
                    }
                    className="mt-3 w-full"
                  />
                  <p className="mt-1 text-xs text-black/58">
                    Confidence: {taskConfidence[activeTask.taskKey] ?? 65}/100
                  </p>
                </div>

                <div className="rounded-2xl border border-black/10 bg-white/80 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-black/45">Task notes</p>
                  <textarea
                    className="mt-3 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                    rows={3}
                    value={taskNotes[activeTask.taskKey] || ""}
                    onChange={(event) =>
                      setTaskNotes((prev) => ({
                        ...prev,
                        [activeTask.taskKey]: event.target.value
                      }))
                    }
                    placeholder="Write blockers, user feedback, links, and next step notes."
                  />
                </div>

                <div className="rounded-2xl border border-black/10 bg-white/80 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-black/45">Resources and videos</p>
                  <div className="mt-3 grid gap-2">
                    {activeResources.map((resource) => (
                      <a
                        key={resource.url}
                        href={resource.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm hover:bg-black hover:text-white transition"
                      >
                        <span className="text-[11px] uppercase tracking-[0.2em] opacity-70">{resource.type}</span>
                        <p className="mt-1">{resource.title}</p>
                      </a>
                    ))}
                  </div>
                </div>

                <button
                  className="w-full px-4 py-2 rounded-full bg-ink text-white text-sm"
                  onClick={() => toggleTask(activeTask.stageId, activeTask.task_id, !activeTask.completed)}
                  disabled={!activeTask.unlocked}
                >
                  {activeTask.completed ? "Mark as not complete" : "Mark complete"}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
