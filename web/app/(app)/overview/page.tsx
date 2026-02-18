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

const defaultIdeaRating = {
  scope: 72,
  complexity: 63,
  market_fit: 70,
  competition_density: 55,
  feasibility: 74
};

export default function OverviewPage() {
  const [progress, setProgress] = useState(0);
  const [nextActions, setNextActions] = useState<string[]>([]);
  const [projectId, setProjectId] = useState<string>("");
  const [ideaRating, setIdeaRating] = useState<any>(defaultIdeaRating);
  const [ideaRatingDetails, setIdeaRatingDetails] = useState<Record<string, any>>({});
  const [ideaAspectFeedback, setIdeaAspectFeedback] = useState<any[]>([]);
  const [ideaFeedback, setIdeaFeedback] = useState<string>("");
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [stages, setStages] = useState<RoadmapStage[]>([]);
  const [planSnapshot, setPlanSnapshot] = useState<any>(null);
  const [topMatches, setTopMatches] = useState<CompetitionPreview[]>([]);

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

      const roadmapRes = await fetch(`/api/roadmap?project_id=${project.id}`);
      if (roadmapRes.ok) {
        const roadmapStages: RoadmapStage[] = await roadmapRes.json();
        setStages(roadmapStages);
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
        setIdeaRating(planData?.idea_rating || defaultIdeaRating);
        setIdeaRatingDetails(planData?.idea_rating_details || {});
        setIdeaAspectFeedback(planData?.idea_aspect_feedback || []);
        setIdeaFeedback(planData?.idea_feedback || "");
        setPlanSnapshot(planData?.business_plan || planData?.lean_business_plan || planData);
      }

      const trendRes = await fetch(trendUrl);
      if (trendRes.ok) setTrend(await trendRes.json());

      const matchRes = await fetch(`/api/competitions?project_id=${project.id}`);
      if (matchRes.ok) {
        const matches = await matchRes.json();
        setTopMatches((matches || []).slice(0, 3));
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
              Live
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
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {stageSummaries.length === 0 ? (
              <p className="text-sm text-black/60">No roadmap yet. Generate one to get started.</p>
            ) : (
              stageSummaries.slice(0, 6).map((stage) => (
                <div key={stage.id} className="rounded-2xl border border-black/10 bg-white/80 p-4">
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
                </div>
              ))
            )}
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

      {!projectId && (
        <div className="text-sm text-black/55">No project found. Complete onboarding to unlock your founder workspace.</div>
      )}
    </div>
  );
}
