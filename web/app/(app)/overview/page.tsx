"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { IdeaRatingPanel } from "../../../components/IdeaRatingPanel";
import { IdeaAspectFeedbackPanel } from "../../../components/IdeaAspectFeedbackPanel";

type RoadmapStage = {
  id: string;
  stage_name: string;
  unlocked: boolean;
  tasks: Array<{ id: string; task: string; completed: boolean }>;
};

type TrendPoint = { version: number; average: number };

type CompetitionPreview = {
  id: string;
  name: string;
  category?: string;
  location?: string;
  match_score?: number;
};

type ReadinessScore = {
  id: string;
  label: string;
  score: number;
  rationale?: string;
  components?: {
    progress_logs?: number;
    roadmap_completion?: number;
    user_submissions?: number;
  };
};

type ResourceLink = {
  id: string;
  title: string;
  type: "Guide" | "Video" | "Course" | "Template";
  tags: string[];
  url: string;
  note: string;
};

const emptyIdeaRating = {
  scope: 0,
  complexity: 0,
  market_fit: 0,
  competition_density: 0,
  feasibility: 0
};

const resourceLibrary: ResourceLink[] = [
  {
    id: "yc-users",
    title: "Y Combinator: How to Talk to Users",
    type: "Guide",
    tags: ["validation", "research", "problem"],
    url: "https://www.ycombinator.com/library/6f-how-to-talk-to-users",
    note: "Interview framework for finding painful, recurring problems."
  },
  {
    id: "pmf-survey",
    title: "PMF Survey Template",
    type: "Template",
    tags: ["validation", "survey", "retention"],
    url: "https://www.lennysnewsletter.com/p/product-market-fit-survey-template",
    note: "Use this to quantify product-market-fit signals."
  },
  {
    id: "nextjs-course",
    title: "Next.js Foundations",
    type: "Course",
    tags: ["build", "mvp", "frontend"],
    url: "https://nextjs.org/learn",
    note: "Fast path for shipping landing + onboarding flow."
  },
  {
    id: "supabase-next",
    title: "Supabase + Next.js Quickstart",
    type: "Guide",
    tags: ["build", "backend", "auth"],
    url: "https://supabase.com/docs/guides/getting-started/quickstarts/nextjs",
    note: "Reference integration for auth, database, and API routes."
  },
  {
    id: "sequoia-plan",
    title: "Sequoia Business Plan Framework",
    type: "Guide",
    tags: ["plan", "pitch", "funding"],
    url: "https://www.sequoiacap.com/article/writing-a-business-plan/",
    note: "Structure your narrative for judges and investors."
  },
  {
    id: "deck-teardown",
    title: "YC Pitch Deck Teardown",
    type: "Video",
    tags: ["pitch", "story", "funding"],
    url: "https://www.youtube.com/watch?v=CBYhVcO4WgI",
    note: "How strong decks communicate traction, timing, and insight."
  }
];

function clampScore(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function estimateIdeaRatingFromProject(project: any) {
  const stage = String(project?.stage || "").toLowerCase();
  const timeline = Number(project?.timeline_available_weeks || 0);
  const teamSize = Number(project?.team_size || 1);
  const demoBuilt = Boolean(project?.demo_built);
  const goalWords = String(project?.goal || "")
    .split(/\s+/)
    .filter(Boolean).length;

  const stageBoost =
    stage.includes("launch") || stage.includes("growth")
      ? 10
      : stage.includes("mvp")
        ? 7
        : stage.includes("prototype")
          ? 4
          : 1;
  const timelineBoost = timeline >= 12 ? 11 : timeline >= 8 ? 8 : timeline >= 5 ? 5 : timeline > 0 ? 2 : 0;
  const teamBoost = teamSize >= 3 ? 9 : teamSize === 2 ? 6 : 2;

  return {
    scope: clampScore(63 + (goalWords > 0 && goalWords <= 12 ? 10 : 6)),
    complexity: clampScore(56 + stageBoost + timelineBoost + teamBoost + (demoBuilt ? 5 : 0)),
    market_fit: clampScore(
      58 + (goalWords > 0 ? 7 : 1) + (demoBuilt ? 7 : 0) + (stage.includes("mvp") || stage.includes("launch") ? 6 : 3)
    ),
    competition_density: clampScore(55 + (demoBuilt ? 6 : 0) + (stage.includes("launch") ? 4 : 2)),
    feasibility: clampScore(57 + stageBoost + timelineBoost + teamBoost + (demoBuilt ? 8 : 0))
  };
}

export default function OverviewPage() {
  const [progress, setProgress] = useState(0);
  const [nextActions, setNextActions] = useState<string[]>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [ideaRating, setIdeaRating] = useState<any>(emptyIdeaRating);
  const [ideaRatingDetails, setIdeaRatingDetails] = useState<Record<string, any>>({});
  const [ideaAspectFeedback, setIdeaAspectFeedback] = useState<any[]>([]);
  const [ideaFeedback, setIdeaFeedback] = useState<string>("");
  const [ideaRatingSource, setIdeaRatingSource] = useState<"ai" | "estimated">("estimated");
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [stages, setStages] = useState<RoadmapStage[]>([]);
  const [planSnapshot, setPlanSnapshot] = useState<any>(null);
  const [topMatches, setTopMatches] = useState<CompetitionPreview[]>([]);
  const [readinessScores, setReadinessScores] = useState<ReadinessScore[]>([]);
  const [selectedStageId, setSelectedStageId] = useState<string>("");
  const [resourceTag, setResourceTag] = useState<string>("all");

  useEffect(() => {
    async function load() {
      const session = await supabase.auth.getSession();
      const userId = session.data.session?.user?.id;
      if (!userId) return;
      const projectRes = await fetch(`/api/projects/latest?user_id=${userId}`);
      if (!projectRes.ok) return;
      const project = await projectRes.json();
      if (!project?.id) return;
      setProjectId(project.id);
      setIdeaRating(estimateIdeaRatingFromProject(project));
      setIdeaRatingDetails({});
      setIdeaAspectFeedback([]);
      setIdeaFeedback("Estimated baseline from project profile. Generate or regenerate your plan for AI-calibrated scores.");
      setIdeaRatingSource("estimated");

      const roadmapRes = await fetch(`/api/roadmap?project_id=${project.id}`);
      if (roadmapRes.ok) {
        const roadmapStages: RoadmapStage[] = await roadmapRes.json();
        setStages(roadmapStages);
        if (roadmapStages[0]?.id) {
          setSelectedStageId((current) => current || roadmapStages[0].id);
        }
        const tasks = roadmapStages.flatMap((stage) => stage.tasks || []);
        const completed = tasks.filter((task) => task.completed).length;
        const pct = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
        setProgress(pct);
        setNextActions(tasks.filter((task) => !task.completed).slice(0, 4).map((task) => task.task));
      }

      const planUrl = `/api/plan?project_id=${project.id}&user_id=${userId}`;
      const trendUrl = `/api/plan/trend?project_id=${project.id}&user_id=${userId}`;
      const planRes = await fetch(planUrl);
      if (planRes.ok) {
        const plan = await planRes.json();
        const planData = plan?.plan || null;
        if (planData?.idea_rating) {
          setIdeaRating(planData.idea_rating);
          setIdeaRatingDetails(planData?.idea_rating_details || {});
          setIdeaAspectFeedback(planData?.idea_aspect_feedback || []);
          setIdeaFeedback(planData?.idea_feedback || "");
          setIdeaRatingSource("ai");
        }
        setPlanSnapshot(planData?.business_plan || planData?.lean_business_plan || planData);
      }

      const trendRes = await fetch(trendUrl);
      if (trendRes.ok) setTrend(await trendRes.json());

      const matchRes = await fetch(`/api/competitions?project_id=${project.id}`);
      if (matchRes.ok) {
        const matches = await matchRes.json();
        setTopMatches((matches || []).slice(0, 3));
      }

      const readinessRes = await fetch(`/api/readiness?project_id=${project.id}`);
      if (readinessRes.ok) {
        const readiness = await readinessRes.json();
        setReadinessScores(Array.isArray(readiness?.scores) ? readiness.scores : []);
      }
    }
    load();
  }, []);

  const stageSummaries = useMemo(
    () =>
      stages.map((stage, index) => {
        const total = stage.tasks?.length || 0;
        const done = stage.tasks?.filter((task) => task.completed).length || 0;
        const pct = total ? Math.round((done / total) * 100) : 0;
        return {
          id: stage.id,
          index: index + 1,
          name: stage.stage_name,
          unlocked: stage.unlocked,
          pct,
          total
        };
      }),
    [stages]
  );

  const selectedStage = useMemo(
    () =>
      stages.find((stage) => stage.id === selectedStageId) ||
      (stages.length > 0 ? stages[0] : null),
    [stages, selectedStageId]
  );

  const availableResourceTags = useMemo(() => {
    const set = new Set<string>();
    resourceLibrary.forEach((resource) => resource.tags.forEach((tag) => set.add(tag)));
    return ["all", ...Array.from(set)];
  }, []);

  const filteredResources = useMemo(() => {
    if (resourceTag === "all") return resourceLibrary;
    return resourceLibrary.filter((resource) => resource.tags.includes(resourceTag));
  }, [resourceTag]);

  const stageResources = useMemo(() => {
    if (!selectedStage?.stage_name) return filteredResources.slice(0, 4);
    const label = selectedStage.stage_name.toLowerCase();
    const inferredTags: string[] = [];
    if (label.includes("ideation") || label.includes("validation")) inferredTags.push("validation", "research");
    if (label.includes("build") || label.includes("mvp") || label.includes("prototype")) inferredTags.push("build", "backend", "frontend");
    if (label.includes("pitch") || label.includes("fund") || label.includes("competition")) inferredTags.push("pitch", "funding", "plan");
    if (inferredTags.length === 0) return filteredResources.slice(0, 4);

    const prioritized = filteredResources.filter((resource) =>
      resource.tags.some((tag) => inferredTags.includes(tag))
    );
    return prioritized.length > 0 ? prioritized.slice(0, 4) : filteredResources.slice(0, 4);
  }, [filteredResources, selectedStage]);

  const improvementNotes = useMemo(() => {
    const keys = ["scope", "complexity", "market_fit", "competition_density", "feasibility"];
    return keys
      .map((key) => {
        const value = ideaRatingDetails?.[key];
        if (!value || typeof value !== "object") return null;
        const improvement = String(value.improve_with || value.improveWith || "").trim();
        return improvement ? { key, improvement } : null;
      })
      .filter(Boolean)
      .slice(0, 3) as Array<{ key: string; improvement: string }>;
  }, [ideaRatingDetails]);

  function renderTrend() {
    if (trend.length < 2) {
      return <p className="text-sm text-black/55">Generate additional plan versions to unlock trend lines.</p>;
    }
    const max = Math.max(...trend.map((point) => point.average));
    const min = Math.min(...trend.map((point) => point.average));
    const range = Math.max(10, max - min);
    const points = trend
      .map((point, index) => {
        const x = (index / (trend.length - 1)) * 300 + 10;
        const y = 86 - ((point.average - min) / range) * 66;
        return `${x},${y}`;
      })
      .join(" ");
    const areaPoints = `${points} 310,96 10,96`;

    return (
      <svg width="320" height="108" className="mt-3">
        <defs>
          <linearGradient id="overview-trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#111827" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#111827" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon fill="url(#overview-trend-fill)" points={areaPoints} />
        <polyline fill="none" stroke="#111827" strokeWidth="2.4" points={points} />
        {trend.map((point, index) => {
          const x = (index / (trend.length - 1)) * 300 + 10;
          const y = 86 - ((point.average - min) / range) * 66;
          return <circle key={point.version} cx={x} cy={y} r="3.2" fill="#111827" />;
        })}
      </svg>
    );
  }

  const ringRadius = 52;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDash = (progress / 100) * ringCircumference;

  return (
    <div className="os-page space-y-7">
      <section className="card p-8 relative overflow-hidden">
        <div className="absolute -top-20 -right-12 h-56 w-56 rounded-full bg-white/55 blur-2xl" />
        <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-black/[0.03]" />
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-black/45">Execution Snapshot</p>
            <h2 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight leading-[1.04]">
              Build fast, track proof, and improve your startup rating week by week.
            </h2>
            <p className="mt-5 text-base md:text-lg text-black/65 max-w-2xl">
              Your founder workspace now ties roadmap progress, competition matching, and idea feedback into one live system.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="/roadmap" className="px-5 py-2.5 rounded-full bg-ink text-white text-sm">
                Continue Roadmap
              </a>
              <a href="/competitions" className="px-5 py-2.5 rounded-full border border-black/15 bg-white/80 text-sm">
                Explore Competitions
              </a>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-2xl border border-black/10 bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-black/45">Roadmap completion</p>
              <p className="mt-2 text-3xl font-semibold">{progress}%</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-black/45">Active stages</p>
              <p className="mt-2 text-3xl font-semibold">{stageSummaries.length}</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-black/45">Best competition match</p>
              <p className="mt-2 text-sm font-medium">{topMatches[0]?.name || "Generate a project plan to unlock matches"}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="card p-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-black/40">Progress Engine</p>
              <p className="mt-2 text-lg font-semibold">Your next milestone pipeline</p>
            </div>
            <div className="relative w-[132px] h-[132px] rounded-full bg-black/[0.03] grid place-items-center">
              <svg width="132" height="132" viewBox="0 0 132 132">
                <circle cx="66" cy="66" r={ringRadius} stroke="#CBD5E1" strokeWidth="12" fill="none" />
                <circle
                  cx="66"
                  cy="66"
                  r={ringRadius}
                  stroke="#111827"
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${ringDash} ${ringCircumference}`}
                  transform="rotate(-90 66 66)"
                />
              </svg>
              <span className="absolute text-2xl font-semibold">{progress}%</span>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {nextActions.length === 0 ? (
              <p className="text-sm text-black/60">No tasks yet. Generate your roadmap to start execution.</p>
            ) : (
              nextActions.map((task, index) => (
                <div key={task} className="rounded-2xl border border-black/10 bg-white/80 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-black/45">Action {index + 1}</p>
                  <p className="mt-1 text-sm text-black/78">{task}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card p-7 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-black/40">Detailed Idea Feedback</p>
              <p className="mt-2 text-lg font-semibold">How your idea is scored and why</p>
            </div>
            <span className="px-3 py-1 rounded-full border border-black/15 bg-white/80 text-[11px] uppercase tracking-[0.22em] text-black/55">
              {ideaRatingSource === "ai" ? "AI-calibrated" : "Estimated"}
            </span>
          </div>
          <IdeaRatingPanel ideaRating={ideaRating} details={ideaRatingDetails} showHeader={false} />
          <div className="rounded-2xl border border-black/10 bg-white/80 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-black/45">AI feedback</p>
            <p className="mt-2 text-sm text-black/75">
              {ideaFeedback || "Generate your plan to unlock detailed strengths, risks, and improvement recommendations."}
            </p>
          </div>
          {improvementNotes.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-3">
              {improvementNotes.map((note) => (
                <div key={note.key} className="rounded-2xl border border-black/10 bg-white/72 p-3">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-black/45">{note.key.replace("_", " ")}</p>
                  <p className="mt-1 text-xs text-black/72">{note.improvement}</p>
                </div>
              ))}
            </div>
          )}
          {renderTrend()}
        </div>
      </section>

      <section className="card p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-black/40">Readiness Scorecards</p>
            <p className="mt-2 text-lg font-semibold">Competition, pitch, accelerator, technical, and market readiness</p>
          </div>
          <a className="text-xs uppercase tracking-[0.22em] text-black/55" href="/progress">
            Update progress
          </a>
        </div>

        {readinessScores.length === 0 ? (
          <p className="mt-4 text-sm text-black/60">
            Log progress and complete roadmap tasks to unlock readiness scorecards.
          </p>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {readinessScores.map((score) => {
              const progressComponent = score.components?.progress_logs || 0;
              const roadmapComponent = score.components?.roadmap_completion || 0;
              const submissionComponent = score.components?.user_submissions || 0;
              return (
                <article key={score.id} className="rounded-2xl border border-black/10 bg-white/82 p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-black/45">{score.label}</p>
                  <p className="mt-2 text-3xl font-semibold">{score.score}%</p>

                  <div className="mt-4 space-y-2">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-black/60">
                        <span>Progress logs</span>
                        <span>{progressComponent}%</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-black/10 overflow-hidden">
                        <span className="block h-full bg-black" style={{ width: `${progressComponent}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-black/60">
                        <span>Roadmap completion</span>
                        <span>{roadmapComponent}%</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-black/10 overflow-hidden">
                        <span className="block h-full bg-black" style={{ width: `${roadmapComponent}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-black/60">
                        <span>User submissions</span>
                        <span>{submissionComponent}%</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-black/10 overflow-hidden">
                        <span className="block h-full bg-black" style={{ width: `${submissionComponent}%` }} />
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-black/58">{score.rationale || ""}</p>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="card p-7 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-black/40">Idea Aspect Diagnostic</p>
            <p className="mt-2 text-lg font-semibold">Feedback across all key startup aspects</p>
          </div>
          <a className="text-xs uppercase tracking-[0.22em] text-black/55" href="/plan">
            Open full plan
          </a>
        </div>
        <IdeaAspectFeedbackPanel items={ideaAspectFeedback} compact />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="card p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-black/40">Execution Map</p>
              <p className="mt-2 text-lg font-semibold">Stage-by-stage roadmap status</p>
            </div>
            <a className="text-xs uppercase tracking-[0.22em] text-black/55" href="/roadmap">
              Open roadmap
            </a>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[0.46fr_0.54fr]">
            <div className="grid gap-3">
              {stageSummaries.length === 0 ? (
                <p className="text-sm text-black/60">No roadmap yet. Generate one to get started.</p>
              ) : (
                stageSummaries.slice(0, 6).map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => setSelectedStageId(stage.id)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selectedStage?.id === stage.id
                        ? "border-black/25 bg-white shadow-[0_20px_45px_rgba(15,23,42,0.12)]"
                        : "border-black/10 bg-white/80 hover:border-black/18 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-black/45">Stage {stage.index}</p>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.2em] ${
                          stage.unlocked ? "bg-black text-white" : "bg-black/10 text-black/50"
                        }`}
                      >
                        {stage.unlocked ? "Unlocked" : "Locked"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium">{stage.name}</p>
                    <div className="mt-3 h-2 rounded-full bg-black/10 overflow-hidden">
                      <span className="block h-full bg-black" style={{ width: `${stage.pct}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-black/55">
                      {stage.pct}% complete · {stage.total} tasks
                    </p>
                  </button>
                ))
              )}
            </div>

            <div className="rounded-2xl border border-black/12 bg-white/86 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-black/45">Stage detail</p>
              {selectedStage ? (
                <>
                  <h4 className="mt-2 text-lg font-semibold">{selectedStage.stage_name}</h4>
                  <p className="mt-1 text-xs text-black/55">
                    {selectedStage.tasks.filter((task) => task.completed).length}/{selectedStage.tasks.length} tasks complete
                  </p>
                  <div className="mt-3 space-y-2">
                    {selectedStage.tasks.slice(0, 5).map((task, index) => (
                      <div key={task.id} className="rounded-xl border border-black/8 bg-white/90 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-black/45">Task {index + 1}</p>
                        <p className="mt-1 text-sm text-black/78">{task.task}</p>
                      </div>
                    ))}
                    {selectedStage.tasks.length === 0 && (
                      <p className="text-sm text-black/60">No tasks in this stage yet.</p>
                    )}
                  </div>
                </>
              ) : (
                <p className="mt-2 text-sm text-black/60">Select a stage to inspect its active tasks.</p>
              )}
            </div>
          </div>
        </div>

        <div className="card p-7 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-black/40">Top Matches</p>
              <p className="mt-2 text-lg font-semibold">Best-fit competitions this week</p>
            </div>
            <a className="text-xs uppercase tracking-[0.22em] text-black/55" href="/competitions">
              View all
            </a>
          </div>
          {topMatches.length === 0 ? (
            <p className="text-sm text-black/60">Competition matches unlock when project context is available.</p>
          ) : (
            <div className="space-y-3">
              {topMatches.map((match, index) => (
                <div key={match.id} className="rounded-2xl border border-black/10 bg-white/80 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.22em] text-black/45">Match #{index + 1}</p>
                      <p className="mt-1 text-sm font-medium">{match.name}</p>
                      <p className="mt-1 text-xs text-black/58">
                        {match.category || "General"} · {match.location || "Global"}
                      </p>
                    </div>
                    <span className="text-lg font-semibold">{match.match_score || 0}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="rounded-2xl border border-black/10 bg-white/70 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-black/45">Plan Snapshot</p>
            <p className="mt-2 text-sm text-black/75">
              {planSnapshot?.problem_statement ||
                planSnapshot?.problem ||
                "Define the exact founder problem you solve and pair it with measurable proof."}
            </p>
          </div>
        </div>
      </section>

      <section className="card p-7 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-black/40">Founder Resource Vault</p>
            <p className="mt-2 text-lg font-semibold">Guides, videos, and templates to execute faster</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableResourceTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setResourceTag(tag)}
                className={`px-3 py-1 rounded-full border text-[11px] uppercase tracking-[0.2em] transition ${
                  resourceTag === tag
                    ? "bg-black text-white border-black"
                    : "bg-white/80 text-black/62 border-black/12 hover:border-black/25"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {stageResources.map((resource) => (
            <article key={resource.id} className="rounded-2xl border border-black/10 bg-white/82 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] uppercase tracking-[0.2em] text-black/45">{resource.type}</p>
                <span className="px-2 py-0.5 rounded-full bg-black/8 text-[10px] uppercase tracking-[0.18em] text-black/55">
                  {resource.tags[0]}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-black/84">{resource.title}</p>
              <p className="mt-2 text-xs text-black/62">{resource.note}</p>
              <a
                href={resource.url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex text-xs uppercase tracking-[0.18em] text-black/60 underline underline-offset-4"
              >
                Open resource
              </a>
            </article>
          ))}
        </div>
      </section>

      {!projectId && (
        <div className="text-sm text-black/55">No project found. Complete onboarding to unlock your founder workspace.</div>
      )}
    </div>
  );
}
