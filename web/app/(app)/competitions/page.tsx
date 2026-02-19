"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

type Competition = {
  id: string;
  name: string;
  category?: string;
  domain_focus?: string;
  stage_fit?: string;
  requires_demo?: boolean;
  requires_plan?: boolean;
  location?: string;
  application_link?: string;
  judging_focus?: string;
  description?: string;
  notes?: string;
  summary?: string;
  eligibility_age_min?: number;
  eligibility_age_max?: number;
  team_size_max?: number;
  deadline?: string | null;
  match_score?: number;
  match_breakdown?: {
    domain_alignment?: number;
    stage_alignment?: number;
    goal_alignment?: number;
    readiness_fit?: number;
    accessibility_fit?: number;
    judging_alignment?: number;
    raw_composite?: number;
    calibrated_score?: number;
  };
  progression?: string[];
};

type TrackerStatus = "not_started" | "researching" | "drafting" | "submitted" | "finalist";
type TrackerEntry = { status: TrackerStatus; note: string };
type SortMode = "fit_desc" | "fit_asc" | "name_asc" | "demo_first" | "plan_first";

const stageOptions = ["Ideation", "Prototype", "MVP", "Launch", "Research", "Growth"];
const trackerOptions: Array<{ value: TrackerStatus; label: string }> = [
  { value: "not_started", label: "Not started" },
  { value: "researching", label: "Researching" },
  { value: "drafting", label: "Drafting submission" },
  { value: "submitted", label: "Submitted" },
  { value: "finalist", label: "Finalist / Won" }
];

function summarizeCompetition(item: Competition) {
  if (item.summary) return item.summary;
  const category = item.category || "General";
  const stage = item.stage_fit || "Any stage";
  const location = item.location || "Global";
  const requirements = [
    item.requires_demo ? "demo required" : "demo optional",
    item.requires_plan ? "plan required" : "plan optional"
  ].join(", ");
  return `${category} opportunity for ${stage} teams in ${location}; ${requirements}.`;
}

function normalizeCompetitionName(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+(national|regional|global|virtual)\s+(spring|summer|fall|winter)\s+20\d{2}$/i, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeCompetitionList(list: Competition[]) {
  const map = new Map<string, Competition>();
  for (const item of list) {
    const key = `${normalizeCompetitionName(item.name)}|${String(item.application_link || "").toLowerCase()}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, item);
      continue;
    }
    const existingScore = Number(existing.match_score || 0);
    const nextScore = Number(item.match_score || 0);
    if (nextScore > existingScore) {
      map.set(key, item);
    }
  }
  return Array.from(map.values());
}

function progressionFor(item: Competition | null) {
  if (!item) return [];
  if (Array.isArray(item.progression) && item.progression.length > 0) return item.progression;
  return ["Application", "Semifinal", "Final"];
}

function fitReasons(item: Competition, project: any) {
  const reasons: string[] = [];
  const projectDomain = String(project?.domain || "").toLowerCase();
  const projectStage = String(project?.stage || "").toLowerCase();
  const projectGoal = String(project?.goal || "").toLowerCase();
  const domainFocus = String(item.domain_focus || "").toLowerCase();
  const stageFit = String(item.stage_fit || "").toLowerCase();
  const category = String(item.category || "").toLowerCase();

  if (projectDomain && domainFocus.includes(projectDomain)) {
    reasons.push(`Aligned with your domain (${project.domain}).`);
  }
  if (projectStage && stageFit.includes(projectStage)) {
    reasons.push(`Fits your current stage (${project.stage}).`);
  }
  if (projectGoal && category.includes(projectGoal.split(" ")[0])) {
    reasons.push(`Category supports your goal (${project.goal}).`);
  }
  if (item.requires_demo && project?.demo_built) {
    reasons.push("You already have a demo, which increases readiness.");
  } else if (!item.requires_demo) {
    reasons.push("No demo required, so you can apply sooner.");
  }
  if (!item.requires_plan) {
    reasons.push("Business plan is optional, reducing submission friction.");
  }
  if (reasons.length === 0) {
    reasons.push("General fit based on student founder profile and timeline.");
  }
  return reasons.slice(0, 4);
}

function trackerBadge(status: TrackerStatus) {
  if (status === "finalist") return "bg-emerald-600 text-white";
  if (status === "submitted") return "bg-sky-600 text-white";
  if (status === "drafting") return "bg-amber-500 text-black";
  if (status === "researching") return "bg-black text-white";
  return "bg-black/10 text-black/55";
}

function scoreTone(score: number) {
  if (score >= 90) return "text-emerald-700";
  if (score >= 82) return "text-sky-700";
  if (score >= 74) return "text-amber-700";
  return "text-black";
}

function scoreRows(item: Competition) {
  const breakdown = item.match_breakdown || {};
  return [
    { label: "Domain", value: breakdown.domain_alignment },
    { label: "Stage", value: breakdown.stage_alignment },
    { label: "Goal", value: breakdown.goal_alignment },
    { label: "Readiness", value: breakdown.readiness_fit },
    { label: "Access", value: breakdown.accessibility_fit },
    { label: "Judging", value: breakdown.judging_alignment }
  ];
}

export default function CompetitionsPage() {
  const [items, setItems] = useState<Competition[]>([]);
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState("");
  const [location, setLocation] = useState("");
  const [stage, setStage] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState<SortMode>("fit_desc");
  const [requireDemo, setRequireDemo] = useState(false);
  const [requirePlan, setRequirePlan] = useState(false);
  const [projectId, setProjectId] = useState<string>("");
  const [project, setProject] = useState<any>(null);
  const [bestReason, setBestReason] = useState<string>("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(24);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [tracker, setTracker] = useState<Record<string, TrackerEntry>>({});
  const [trackedOnly, setTrackedOnly] = useState(false);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    const favoritesRaw = window.localStorage.getItem("launchlab:competition:favorites");
    if (favoritesRaw) setFavorites(JSON.parse(favoritesRaw));
    const trackerRaw = window.localStorage.getItem("launchlab:competition:tracker");
    if (trackerRaw) setTracker(JSON.parse(trackerRaw));
  }, []);

  useEffect(() => {
    window.localStorage.setItem("launchlab:competition:favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    window.localStorage.setItem("launchlab:competition:tracker", JSON.stringify(tracker));
  }, [tracker]);

  useEffect(() => {
    async function loadProject() {
      const session = await supabase.auth.getSession();
      const userId = session.data.session?.user?.id;
      if (!userId) return;
      const projectRes = await fetch(`/api/projects/latest?user_id=${userId}`);
      if (!projectRes.ok) return;
      const data = await projectRes.json();
      if (data?.id) setProjectId(data.id);
      setProject(data || null);
    }
    loadProject();
  }, []);

  useEffect(() => {
    async function loadCompetitions() {
      setLoading(true);
      setError("");
      const res = await fetch(
        `/api/competitions?domain=${encodeURIComponent(domain)}&location=${encodeURIComponent(location)}&stage=${encodeURIComponent(stage)}&project_id=${projectId}`
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Failed to load competitions");
        setLoading(false);
        return;
      }
      const data = await res.json();
      const deduped = dedupeCompetitionList(data || []);
      setItems(deduped);
      setVisibleCount(24);
      if (!selectedId && deduped?.[0]?.id) setSelectedId(deduped[0].id);

      const best = deduped?.[0];
      if (best) {
        const reasonRes = await fetch("/api/groq/best-match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project, match: best, type: "competition" })
        });
        if (reasonRes.ok) {
          const reason = await reasonRes.json();
          setBestReason(reason.reasoning || "");
        }
      }
      setLoading(false);
    }
    loadCompetitions();
  }, [domain, location, stage, projectId, project]);

  const locationOptions = useMemo(
    () => Array.from(new Set(items.map((item) => item.location).filter(Boolean) as string[])).slice(0, 80),
    [items]
  );

  const categoryOptions = useMemo(
    () => Array.from(new Set(items.map((item) => item.category).filter(Boolean) as string[])).slice(0, 24),
    [items]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filteredRows = items.filter((item) => {
      const summary = summarizeCompetition(item);
      const searchMatch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        String(item.category || "").toLowerCase().includes(query) ||
        String(item.stage_fit || "").toLowerCase().includes(query) ||
        String(item.location || "").toLowerCase().includes(query) ||
        String(item.description || "").toLowerCase().includes(query) ||
        String(item.judging_focus || "").toLowerCase().includes(query) ||
        summary.toLowerCase().includes(query);
      const demoMatch = !requireDemo || Boolean(item.requires_demo);
      const planMatch = !requirePlan || Boolean(item.requires_plan);
      const categoryMatch = !category || String(item.category || "").toLowerCase() === category.toLowerCase();
      const favoriteMatch = !favoritesOnly || Boolean(favorites[item.id]);
      const trackedMatch = !trackedOnly || (tracker[item.id]?.status && tracker[item.id].status !== "not_started");
      return searchMatch && demoMatch && planMatch && categoryMatch && favoriteMatch && trackedMatch;
    });

    return filteredRows.sort((a, b) => {
      if (sortBy === "fit_desc") return (b.match_score || 0) - (a.match_score || 0);
      if (sortBy === "fit_asc") return (a.match_score || 0) - (b.match_score || 0);
      if (sortBy === "name_asc") return a.name.localeCompare(b.name);
      if (sortBy === "demo_first") return Number(b.requires_demo) - Number(a.requires_demo);
      if (sortBy === "plan_first") return Number(b.requires_plan) - Number(a.requires_plan);
      return 0;
    });
  }, [items, search, requireDemo, requirePlan, category, favoritesOnly, favorites, trackedOnly, tracker, sortBy]);

  const best = filtered[0];
  const bestMatches = filtered.slice(0, 5);
  const recommended = filtered.slice(0, 4);
  const visibleItems = filtered.slice(0, visibleCount);
  const compareItems = filtered.filter((item) => compareIds.includes(item.id)).slice(0, 3);
  const selected = items.find((item) => item.id === selectedId) || null;
  const selectedProgression = progressionFor(selected);
  const trackedCount = Object.values(tracker).filter((entry) => entry.status !== "not_started").length;

  function updateTracker(id: string, patch: Partial<TrackerEntry>) {
    setTracker((prev) => {
      const current = prev[id] || { status: "not_started" as TrackerStatus, note: "" };
      return { ...prev, [id]: { ...current, ...patch } };
    });
  }

  function toggleCompare(id: string) {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  function downloadShortlist() {
    const shortlisted = filtered.filter(
      (item) => favorites[item.id] || (tracker[item.id] && tracker[item.id].status !== "not_started")
    );
    const rows = shortlisted.map((item) => {
      const state = tracker[item.id] || { status: "not_started", note: "" };
      return [
        item.name,
        item.category || "",
        item.stage_fit || "",
        item.location || "",
        String(item.match_score || 0),
        state.status,
        (state.note || "").replace(/\n/g, " ")
      ];
    });
    const csv = [["Name", "Category", "Stage", "Location", "MatchScore", "PipelineStatus", "Notes"], ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "launchlab-competition-shortlist.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="os-page space-y-6">
      <section className="card p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-black/45">Competition Intelligence</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">Detailed opportunities and best-match pipeline</h2>
            <p className="mt-3 text-black/65 max-w-3xl">
              Every competition now includes a summary, requirements, fit rationale, and submission tracking so you can
              decide where to apply faster.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-2xl border border-black/10 bg-white/80 px-4 py-3 min-w-[150px]">
              <p className="text-xs uppercase tracking-[0.2em] text-black/45">Total matches</p>
              <p className="mt-1 text-2xl font-semibold">{filtered.length}</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/80 px-4 py-3 min-w-[150px]">
              <p className="text-xs uppercase tracking-[0.2em] text-black/45">Top score</p>
              <p className="mt-1 text-2xl font-semibold">{best?.match_score || 0}%</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/80 px-4 py-3 min-w-[150px]">
              <p className="text-xs uppercase tracking-[0.2em] text-black/45">Tracked</p>
              <p className="mt-1 text-2xl font-semibold">{trackedCount}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input
            className="rounded-2xl border border-black/10 bg-white/85 px-4 py-3 text-sm"
            placeholder="Search by name, category, or summary"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <input
            className="rounded-2xl border border-black/10 bg-white/85 px-4 py-3 text-sm"
            placeholder="Domain filter"
            value={domain}
            onChange={(event) => setDomain(event.target.value)}
          />
          <select
            className="rounded-2xl border border-black/10 bg-white/85 px-4 py-3 text-sm"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          >
            <option value="">All locations</option>
            {locationOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select
            className="rounded-2xl border border-black/10 bg-white/85 px-4 py-3 text-sm"
            value={stage}
            onChange={(event) => setStage(event.target.value)}
          >
            <option value="">All stages</option>
            {stageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select
            className="rounded-2xl border border-black/10 bg-white/85 px-4 py-3 text-sm"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">All categories</option>
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-[auto_auto_auto_auto_1fr_auto] items-center">
          <label className="inline-flex items-center gap-2 rounded-full border border-black/12 bg-white/80 px-4 py-2 text-sm">
            <input type="checkbox" checked={requireDemo} onChange={(event) => setRequireDemo(event.target.checked)} />
            Requires demo
          </label>
          <label className="inline-flex items-center gap-2 rounded-full border border-black/12 bg-white/80 px-4 py-2 text-sm">
            <input type="checkbox" checked={requirePlan} onChange={(event) => setRequirePlan(event.target.checked)} />
            Requires business plan
          </label>
          <label className="inline-flex items-center gap-2 rounded-full border border-black/12 bg-white/80 px-4 py-2 text-sm">
            <input type="checkbox" checked={favoritesOnly} onChange={(event) => setFavoritesOnly(event.target.checked)} />
            Favorites only
          </label>
          <label className="inline-flex items-center gap-2 rounded-full border border-black/12 bg-white/80 px-4 py-2 text-sm">
            <input type="checkbox" checked={trackedOnly} onChange={(event) => setTrackedOnly(event.target.checked)} />
            Tracked only
          </label>
          <div />
          <select
            className="rounded-full border border-black/12 bg-white/85 px-4 py-2 text-sm"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortMode)}
          >
            <option value="fit_desc">Sort: Highest fit</option>
            <option value="fit_asc">Sort: Lowest fit</option>
            <option value="name_asc">Sort: Name</option>
            <option value="demo_first">Sort: Demo required first</option>
            <option value="plan_first">Sort: Plan required first</option>
          </select>
        </div>
      </section>

      {best && (
        <section className="card p-7">
          <p className="text-xs uppercase tracking-[0.3em] text-black/45">Best Match</p>
          <h3 className="mt-3 text-3xl font-semibold">{best.name}</h3>
          <p className="mt-2 text-black/65">
            {best.category || "General"} · {best.stage_fit || "Any stage"} · {best.location || "Global"}
          </p>
          <p className="mt-3 text-sm text-black/75">{summarizeCompetition(best)}</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-black/12 bg-white/80 px-4 py-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-black" />
            {best.match_score || 0}% AI fit
          </div>
          <p className="mt-3 text-xs text-black/56">
            Score formula: Domain 28% · Stage 20% · Goal 18% · Readiness 15% · Accessibility 10% · Judging 9%
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {scoreRows(best).map((row) => (
              <div key={row.label} className="rounded-xl border border-black/10 bg-white/80 px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.18em] text-black/45">{row.label}</p>
                <p className="mt-1 text-sm font-semibold">{row.value ?? "--"}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-black/72">
            {bestReason || "Analyzing why this is the strongest fit for your project profile..."}
          </p>
        </section>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <section className="card p-7">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs uppercase tracking-[0.3em] text-black/45">Best matches for your project</p>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 rounded-full border border-black/15 text-xs" onClick={downloadShortlist}>
              Export shortlist CSV
            </button>
            {loading && <span className="text-xs text-black/50">Refreshing...</span>}
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {bestMatches.map((item, index) => (
            <article
              key={item.id}
              className="rounded-2xl border border-black/10 bg-white/84 p-4 cursor-pointer"
              onClick={() => setSelectedId(item.id)}
            >
              <p className="text-[11px] uppercase tracking-[0.2em] text-black/45">Rank {index + 1}</p>
              <p className="mt-2 text-base font-semibold leading-snug">{item.name}</p>
              <p className="mt-2 text-xs text-black/60">
                {item.category || "General"} · {item.stage_fit || "Any stage"}
              </p>
              <p className="mt-2 text-xs text-black/72">{summarizeCompetition(item)}</p>
              <p className="mt-2 text-xs text-black/68 line-clamp-2">
                {item.description || item.notes || item.judging_focus || "Competition summary unavailable."}
              </p>
              <p className={`mt-3 text-xl font-semibold ${scoreTone(item.match_score || 0)}`}>{item.match_score || 0}%</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card p-7">
        <p className="text-xs uppercase tracking-[0.3em] text-black/45">Recommended now</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {recommended.map((item) => (
            <article key={item.id} className="rounded-2xl border border-black/10 bg-white/84 p-5">
              <p className="text-lg font-semibold leading-snug">{item.name}</p>
              <p className="mt-2 text-sm text-black/62">
                {item.category || "General"} · {item.stage_fit || "Any stage"} · {item.location || "Global"}
              </p>
              <p className="mt-3 text-sm text-black/72">{item.description || summarizeCompetition(item)}</p>
              <p className={`mt-4 text-2xl font-semibold ${scoreTone(item.match_score || 0)}`}>{item.match_score || 0}%</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs uppercase tracking-[0.3em] text-black/45">All opportunities</p>
          <p className="text-xs text-black/55">
            Showing {visibleItems.length} of {filtered.length}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {visibleItems.map((item) => {
            const track = tracker[item.id] || { status: "not_started" as TrackerStatus, note: "" };
            return (
              <article key={item.id} className="card p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xl font-semibold leading-snug">{item.name}</p>
                    <p className="mt-1 text-sm text-black/62">
                      {item.category || "General"} · {item.stage_fit || "Any stage"} · {item.location || "Global"}
                    </p>
                  </div>
                  <span className={`text-lg font-semibold whitespace-nowrap ${scoreTone(item.match_score || 0)}`}>
                    {item.match_score || 0}%
                  </span>
                </div>

                <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-black/45">About this competition</p>
                <p className="mt-1 text-sm text-black/68 leading-relaxed">
                  {item.description || item.notes || item.judging_focus || "Student founder competition."}
                </p>
                <p className="mt-2 text-xs text-black/70">{summarizeCompetition(item)}</p>

                <div className="mt-4 rounded-xl border border-black/10 bg-white/85 p-3">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-black/45">Score breakdown</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {scoreRows(item).map((row) => (
                      <div key={`${item.id}-${row.label}`} className="rounded-lg bg-black/5 px-2 py-1.5">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-black/45">{row.label}</p>
                        <p className="text-xs font-semibold">{row.value ?? "--"}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 rounded-full bg-black/8">{item.requires_demo ? "Demo required" : "Demo optional"}</span>
                  <span className="px-2 py-1 rounded-full bg-black/8">{item.requires_plan ? "Plan required" : "Plan optional"}</span>
                  <span className="px-2 py-1 rounded-full bg-black/8">
                    Ages {item.eligibility_age_min || 13}-{item.eligibility_age_max || 19}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-black/8">Team up to {item.team_size_max || 8}</span>
                </div>

                <div className="mt-4 grid gap-2">
                  <label className="text-xs text-black/55">Pipeline status</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={track.status}
                      onChange={(event) => updateTracker(item.id, { status: event.target.value as TrackerStatus })}
                      className="flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                    >
                      {trackerOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] uppercase tracking-[0.18em] ${trackerBadge(track.status)}`}>
                      {track.status.replace("_", " ")}
                    </span>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {item.application_link ? (
                    <a
                      className="inline-flex px-4 py-2 rounded-full bg-ink text-white text-sm"
                      href={item.application_link}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Apply
                    </a>
                  ) : (
                    <span className="inline-flex px-4 py-2 rounded-full border border-black/10 text-xs text-black/55">
                      No application link
                    </span>
                  )}
                  <button
                    className={`inline-flex px-4 py-2 rounded-full border text-sm ${
                      favorites[item.id] ? "border-black bg-black text-white" : "border-black/15 bg-white"
                    }`}
                    onClick={() =>
                      setFavorites((prev) => ({
                        ...prev,
                        [item.id]: !prev[item.id]
                      }))
                    }
                  >
                    {favorites[item.id] ? "Favorited" : "Favorite"}
                  </button>
                  <button
                    className={`inline-flex px-4 py-2 rounded-full border text-sm ${
                      compareIds.includes(item.id) ? "border-black bg-black text-white" : "border-black/15 bg-white"
                    }`}
                    onClick={() => toggleCompare(item.id)}
                  >
                    {compareIds.includes(item.id) ? "Selected" : "Compare"}
                  </button>
                  <button
                    className={`inline-flex px-4 py-2 rounded-full border text-sm ${
                      selectedId === item.id ? "border-black bg-black text-white" : "border-black/15 bg-white"
                    }`}
                    onClick={() => setSelectedId(item.id)}
                  >
                    Details
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {visibleItems.length < filtered.length && (
          <div className="pt-1">
            <button
              className="px-5 py-2.5 rounded-full border border-black/15 bg-white/85 text-sm"
              onClick={() => setVisibleCount((prev) => prev + 24)}
            >
              Load more competitions
            </button>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <p className="py-4 text-sm text-black/60">No competitions match the current filters.</p>
        )}
      </section>

      {selected && (
        <section className="card p-7">
          <p className="text-xs uppercase tracking-[0.3em] text-black/45">Competition Detail</p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h3 className="text-2xl font-semibold">{selected.name}</h3>
              <p className="mt-2 text-sm text-black/65">
                {selected.category || "General"} · {selected.stage_fit || "Any stage"} · {selected.location || "Global"}
              </p>
              <p className="mt-4 text-sm text-black/75">{summarizeCompetition(selected)}</p>
              <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-black/45">Description</p>
              <p className="mt-3 text-sm text-black/72">
                {selected.description || selected.notes || selected.judging_focus || "No additional description available."}
              </p>
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-black/45">Competition progression</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {selectedProgression.map((step, index) => (
                  <div key={`${selected.id}-progression-${index}`} className="inline-flex items-center gap-2">
                    <span className="rounded-full border border-black/12 bg-white/85 px-3 py-1.5 text-xs text-black/75">
                      {step}
                    </span>
                    {index < selectedProgression.length - 1 && <span className="text-black/40">&rarr;</span>}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-black/45">Judging focus</p>
              <p className="mt-1 text-sm text-black/72">{selected.judging_focus || "Execution quality and clarity."}</p>
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-black/45">Score components</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {scoreRows(selected).map((row) => (
                  <div key={`detail-${row.label}`} className="rounded-xl border border-black/10 bg-white/80 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-black/45">{row.label}</p>
                    <p className="text-sm font-semibold">{row.value ?? "--"}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-black/45">Why this fits your project</p>
              <div className="mt-2 space-y-2">
                {fitReasons(selected, project).map((reason) => (
                  <div key={reason} className="rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-sm text-black/78">
                    {reason}
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl border border-black/10 bg-white/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-black/45">Application Profile</p>
                <p className={`mt-2 text-sm font-semibold ${scoreTone(selected.match_score || 0)}`}>
                  AI fit score: {selected.match_score || 0}%
                </p>
                <p className="mt-1 text-xs text-black/55">
                  Formula weights: domain 28, stage 20, goal 18, readiness 15, accessibility 10, judging 9.
                </p>
                <p className="mt-1 text-sm text-black/75">
                  Eligibility: Ages {selected.eligibility_age_min || 13}-{selected.eligibility_age_max || 19}
                </p>
                <p className="mt-1 text-sm text-black/75">Team size: Up to {selected.team_size_max || 8}</p>
                <p className="mt-1 text-sm text-black/75">
                  Deadline: {selected.deadline ? new Date(selected.deadline).toLocaleDateString() : "Rolling / Not listed"}
                </p>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-black/45">Submission Notes</p>
                <textarea
                  className="mt-3 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                  rows={5}
                  value={tracker[selected.id]?.note || ""}
                  onChange={(event) => updateTracker(selected.id, { note: event.target.value })}
                  placeholder="Keep links, requirements, and submission plan notes here."
                />
              </div>
              {selected.application_link && (
                <a
                  className="inline-flex w-full justify-center px-4 py-2.5 rounded-full bg-ink text-white text-sm"
                  href={selected.application_link}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Application
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {compareItems.length > 0 && (
        <section className="card p-7">
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs uppercase tracking-[0.3em] text-black/45">Compare Selected</p>
            <button className="text-xs underline text-black/55" onClick={() => setCompareIds([])}>
              Clear compare
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {compareItems.map((item) => (
              <article key={item.id} className="rounded-2xl border border-black/10 bg-white/84 p-4">
                <p className="text-base font-semibold">{item.name}</p>
                <p className="mt-2 text-xs text-black/60">
                  {item.category || "General"} · {item.stage_fit || "Any stage"} · {item.location || "Global"}
                </p>
                <p className="mt-3 text-xs text-black/70">{summarizeCompetition(item)}</p>
                <p className="mt-3 text-lg font-semibold">{item.match_score || 0}% fit</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
