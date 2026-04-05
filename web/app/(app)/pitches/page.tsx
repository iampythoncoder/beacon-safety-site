"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { withAuthHeaders } from "../../../lib/authFetch";

type Pitch = {
  id: string;
  name: string;
  type?: string;
  audience?: string;
  requires_demo?: boolean;
  requires_plan?: boolean;
  how_to_apply?: string;
  summary?: string;
  relevance_tags?: string;
  eligibility_age_min?: number;
  eligibility_age_max?: number;
  team_size_max?: number;
  match_score?: number;
};

type PipelineStatus = "not_started" | "researching" | "drafting" | "applied" | "scheduled";
type PipelineEntry = { status: PipelineStatus; note: string };
type SortMode = "fit_desc" | "fit_asc" | "name_asc";

const pipelineOptions: Array<{ value: PipelineStatus; label: string }> = [
  { value: "not_started", label: "Not started" },
  { value: "researching", label: "Researching" },
  { value: "drafting", label: "Drafting" },
  { value: "applied", label: "Applied" },
  { value: "scheduled", label: "Pitch scheduled" }
];

function summarizePitch(item: Pitch) {
  if (item.summary) return item.summary;
  const type = item.type || "Pitch event";
  const audience = item.audience || "Founder audience";
  const requirements = [
    item.requires_demo ? "demo required" : "demo optional",
    item.requires_plan ? "plan required" : "plan optional"
  ].join(", ");
  return `${type} for ${audience}; ${requirements}.`;
}

function matchReasons(item: Pitch, project: any) {
  const reasons: string[] = [];
  const tags = String(item.relevance_tags || "").toLowerCase();
  const domain = String(project?.domain || "").toLowerCase();
  const goal = String(project?.goal || "").toLowerCase();
  if (domain && tags.includes(domain)) reasons.push(`Relevant to your domain (${project.domain}).`);
  if (goal && tags.includes(goal.split(" ")[0])) reasons.push(`Supports your goal (${project.goal}).`);
  if (item.requires_demo && project?.demo_built) reasons.push("You already have a demo-ready workflow.");
  if (!item.requires_demo) reasons.push("No demo requirement, so this is a faster submission.");
  if (reasons.length === 0) reasons.push("General founder fit based on stage and opportunity profile.");
  return reasons.slice(0, 4);
}

function pipelineBadge(status: PipelineStatus) {
  if (status === "scheduled") return "bg-emerald-600 text-white";
  if (status === "applied") return "bg-sky-600 text-white";
  if (status === "drafting") return "bg-amber-500 text-black";
  if (status === "researching") return "bg-black text-white";
  return "bg-black/10 text-black/55";
}

export default function PitchesPage() {
  const [items, setItems] = useState<Pitch[]>([]);
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortMode>("fit_desc");
  const [requireDemo, setRequireDemo] = useState(false);
  const [requirePlan, setRequirePlan] = useState(false);
  const [projectId, setProjectId] = useState<string>("");
  const [project, setProject] = useState<any>(null);
  const [bestReason, setBestReason] = useState<string>("");
  const [error, setError] = useState("");
  const [visibleCount, setVisibleCount] = useState(24);
  const [loading, setLoading] = useState(false);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [pipeline, setPipeline] = useState<Record<string, PipelineEntry>>({});
  const [pipelineOnly, setPipelineOnly] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    const favoritesRaw = window.localStorage.getItem("launchlab:pitches:favorites");
    if (favoritesRaw) setFavorites(JSON.parse(favoritesRaw));
    const pipelineRaw = window.localStorage.getItem("launchlab:pitches:pipeline");
    if (pipelineRaw) setPipeline(JSON.parse(pipelineRaw));
  }, []);

  useEffect(() => {
    window.localStorage.setItem("launchlab:pitches:favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    window.localStorage.setItem("launchlab:pitches:pipeline", JSON.stringify(pipeline));
  }, [pipeline]);

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
    async function loadPitches() {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/pitches?domain=${encodeURIComponent(domain)}&project_id=${projectId}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Failed to load pitch opportunities");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setItems(data || []);
      setVisibleCount(24);
      if (!selectedId && data?.[0]?.id) setSelectedId(data[0].id);

      const best = data?.[0];
      if (best) {
        const headers = await withAuthHeaders({ "Content-Type": "application/json" });
        const reasonRes = await fetch("/api/groq/best-match", {
          method: "POST",
          headers,
          body: JSON.stringify({ project, match: best, type: "pitch" })
        });
        if (reasonRes.status === 402) {
          setBestReason("Upgrade to LaunchLab Pro to unlock AI best-match reasoning.");
        } else if (reasonRes.ok) {
          const reason = await reasonRes.json();
          setBestReason(reason.reasoning || "");
        }
      }
      setLoading(false);
    }
    loadPitches();
  }, [domain, projectId, project]);

  const typeOptions = useMemo(
    () => Array.from(new Set(items.map((item) => item.type).filter(Boolean) as string[])).slice(0, 30),
    [items]
  );
  const audienceOptions = useMemo(
    () => Array.from(new Set(items.map((item) => item.audience).filter(Boolean) as string[])).slice(0, 30),
    [items]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows = items.filter((item) => {
      const summary = summarizePitch(item);
      const searchMatch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        String(item.type || "").toLowerCase().includes(query) ||
        String(item.audience || "").toLowerCase().includes(query) ||
        String(item.relevance_tags || "").toLowerCase().includes(query) ||
        summary.toLowerCase().includes(query);
      const demoMatch = !requireDemo || Boolean(item.requires_demo);
      const planMatch = !requirePlan || Boolean(item.requires_plan);
      const typeMatch = !typeFilter || String(item.type || "").toLowerCase() === typeFilter.toLowerCase();
      const audienceMatch =
        !audienceFilter || String(item.audience || "").toLowerCase() === audienceFilter.toLowerCase();
      const favoriteMatch = !favoritesOnly || Boolean(favorites[item.id]);
      const pipelineMatch = !pipelineOnly || (pipeline[item.id] && pipeline[item.id].status !== "not_started");
      return searchMatch && demoMatch && planMatch && typeMatch && audienceMatch && favoriteMatch && pipelineMatch;
    });

    return rows.sort((a, b) => {
      if (sortBy === "fit_desc") return (b.match_score || 0) - (a.match_score || 0);
      if (sortBy === "fit_asc") return (a.match_score || 0) - (b.match_score || 0);
      if (sortBy === "name_asc") return a.name.localeCompare(b.name);
      return 0;
    });
  }, [
    items,
    search,
    requireDemo,
    requirePlan,
    typeFilter,
    audienceFilter,
    favoritesOnly,
    favorites,
    pipelineOnly,
    pipeline,
    sortBy
  ]);

  const best = filtered[0];
  const bestMatches = filtered.slice(0, 5);
  const recommended = filtered.slice(0, 4);
  const visibleItems = filtered.slice(0, visibleCount);
  const selected = items.find((item) => item.id === selectedId) || null;
  const compareItems = filtered.filter((item) => compareIds.includes(item.id)).slice(0, 3);
  const pipelineCount = Object.values(pipeline).filter((entry) => entry.status !== "not_started").length;

  function updatePipeline(id: string, patch: Partial<PipelineEntry>) {
    setPipeline((prev) => {
      const current = prev[id] || { status: "not_started" as PipelineStatus, note: "" };
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

  return (
    <div className="os-page space-y-6">
      <section className="card p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-black/45">Pitch Pipeline</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">Detailed pitch opportunities by readiness</h2>
            <p className="mt-3 text-black/65 max-w-2xl">
              Choose high-fit pitch events using audience data, requirements, and AI match reasoning.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-2xl border border-black/10 bg-white/80 px-4 py-3 min-w-[150px]">
              <p className="text-xs uppercase tracking-[0.2em] text-black/45">Matches</p>
              <p className="mt-1 text-2xl font-semibold">{filtered.length}</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/80 px-4 py-3 min-w-[150px]">
              <p className="text-xs uppercase tracking-[0.2em] text-black/45">Top fit</p>
              <p className="mt-1 text-2xl font-semibold">{best?.match_score || 0}%</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/80 px-4 py-3 min-w-[150px]">
              <p className="text-xs uppercase tracking-[0.2em] text-black/45">Pipeline tracked</p>
              <p className="mt-1 text-2xl font-semibold">{pipelineCount}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input
            className="rounded-2xl border border-black/10 bg-white/85 px-4 py-3 text-sm"
            placeholder="Search by name, audience, or summary"
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
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
          >
            <option value="">All types</option>
            {typeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select
            className="rounded-2xl border border-black/10 bg-white/85 px-4 py-3 text-sm"
            value={audienceFilter}
            onChange={(event) => setAudienceFilter(event.target.value)}
          >
            <option value="">All audiences</option>
            {audienceOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select
            className="rounded-2xl border border-black/10 bg-white/85 px-4 py-3 text-sm"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortMode)}
          >
            <option value="fit_desc">Sort: Highest fit</option>
            <option value="fit_asc">Sort: Lowest fit</option>
            <option value="name_asc">Sort: Name</option>
          </select>
        </div>

        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <label className="inline-flex items-center gap-2 rounded-full border border-black/12 bg-white/80 px-4 py-2">
            <input type="checkbox" checked={requireDemo} onChange={(event) => setRequireDemo(event.target.checked)} />
            Requires demo
          </label>
          <label className="inline-flex items-center gap-2 rounded-full border border-black/12 bg-white/80 px-4 py-2">
            <input type="checkbox" checked={requirePlan} onChange={(event) => setRequirePlan(event.target.checked)} />
            Requires plan
          </label>
          <label className="inline-flex items-center gap-2 rounded-full border border-black/12 bg-white/80 px-4 py-2">
            <input type="checkbox" checked={favoritesOnly} onChange={(event) => setFavoritesOnly(event.target.checked)} />
            Favorites only
          </label>
          <label className="inline-flex items-center gap-2 rounded-full border border-black/12 bg-white/80 px-4 py-2">
            <input type="checkbox" checked={pipelineOnly} onChange={(event) => setPipelineOnly(event.target.checked)} />
            Pipeline only
          </label>
        </div>
      </section>

      {best && (
        <section className="card p-7">
          <p className="text-xs uppercase tracking-[0.3em] text-black/45">Best Match</p>
          <h3 className="mt-3 text-2xl font-semibold">{best.name}</h3>
          <p className="mt-2 text-black/65">
            {best.type || "Pitch event"} · {best.audience || "Founder audience"}
          </p>
          <p className="mt-3 text-sm text-black/75">{summarizePitch(best)}</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-black/12 bg-white/80 px-4 py-2 text-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-black" />
            {best.match_score || 0}% AI fit
          </div>
          <p className="mt-4 text-sm text-black/72">
            {bestReason || "Analyzing why this pitch is your strongest next move..."}
          </p>
        </section>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <section className="card p-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs uppercase tracking-[0.3em] text-black/45">Best pitch matches</p>
          {loading && <span className="text-xs text-black/50">Refreshing...</span>}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {bestMatches.map((item, index) => (
            <article
              key={item.id}
              className="rounded-2xl border border-black/10 bg-white/82 p-4 cursor-pointer"
              onClick={() => setSelectedId(item.id)}
            >
              <p className="text-[11px] uppercase tracking-[0.2em] text-black/45">Rank {index + 1}</p>
              <p className="mt-2 text-sm font-semibold">{item.name}</p>
              <p className="mt-2 text-xs text-black/60">{item.type || "Pitch"} · {item.audience || "Investors"}</p>
              <p className="mt-2 text-xs text-black/72">{summarizePitch(item)}</p>
              <p className="mt-3 text-lg font-semibold">{item.match_score || 0}%</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-black/45">Recommended</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {recommended.map((item) => (
            <article key={item.id} className="rounded-2xl border border-black/10 bg-white/82 p-4">
              <p className="text-sm font-semibold">{item.name}</p>
              <p className="mt-2 text-xs text-black/60">
                {item.type || "Pitch"} · {item.audience || "Investors"}
              </p>
              <p className="mt-2 text-xs text-black/70">{summarizePitch(item)}</p>
              <p className="mt-3 text-lg font-semibold">{item.match_score || 0}%</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs uppercase tracking-[0.3em] text-black/45">All pitch opportunities</p>
          <p className="text-xs text-black/55">
            Showing {visibleItems.length} of {filtered.length}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {visibleItems.map((item) => {
            const entry = pipeline[item.id] || { status: "not_started" as PipelineStatus, note: "" };
            return (
              <article key={item.id} className="card p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xl font-semibold leading-snug">{item.name}</p>
                    <p className="mt-1 text-sm text-black/62">
                      {item.type || "Pitch"} · {item.audience || "Founder audience"}
                    </p>
                  </div>
                  <span className="text-lg font-semibold">{item.match_score || 0}%</span>
                </div>
                <p className="mt-3 text-sm text-black/74">{summarizePitch(item)}</p>
                <p className="mt-2 text-sm text-black/66">{item.how_to_apply || "Apply online."}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 rounded-full bg-black/8">{item.requires_demo ? "Demo required" : "Demo optional"}</span>
                  <span className="px-2 py-1 rounded-full bg-black/8">{item.requires_plan ? "Plan required" : "Plan optional"}</span>
                  <span className="px-2 py-1 rounded-full bg-black/8">
                    Ages {item.eligibility_age_min || 13}-{item.eligibility_age_max || 19}
                  </span>
                </div>
                <div className="mt-4">
                  <label className="text-xs text-black/55">Pipeline status</label>
                  <div className="mt-2 flex items-center gap-2">
                    <select
                      className="flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                      value={entry.status}
                      onChange={(event) => updatePipeline(item.id, { status: event.target.value as PipelineStatus })}
                    >
                      {pipelineOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] uppercase tracking-[0.18em] ${pipelineBadge(entry.status)}`}>
                      {entry.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
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
          <button
            className="px-5 py-2.5 rounded-full border border-black/15 bg-white/85 text-sm"
            onClick={() => setVisibleCount((prev) => prev + 24)}
          >
            Load more pitches
          </button>
        )}
        {!loading && filtered.length === 0 && (
          <p className="py-4 text-sm text-black/60">No pitch opportunities match the active filters.</p>
        )}
      </section>

      {selected && (
        <section className="card p-7">
          <p className="text-xs uppercase tracking-[0.3em] text-black/45">Pitch Detail</p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h3 className="text-2xl font-semibold">{selected.name}</h3>
              <p className="mt-2 text-sm text-black/65">
                {selected.type || "Pitch event"} · {selected.audience || "Founder audience"}
              </p>
              <p className="mt-4 text-sm text-black/75">{summarizePitch(selected)}</p>
              <p className="mt-3 text-sm text-black/72">{selected.how_to_apply || "Apply online with a short startup brief."}</p>
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-black/45">Why this fits your project</p>
              <div className="mt-2 space-y-2">
                {matchReasons(selected, project).map((reason) => (
                  <div key={reason} className="rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-sm text-black/78">
                    {reason}
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl border border-black/10 bg-white/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-black/45">Pitch Profile</p>
                <p className="mt-2 text-sm text-black/75">AI fit score: {selected.match_score || 0}%</p>
                <p className="mt-1 text-sm text-black/75">
                  Eligibility: Ages {selected.eligibility_age_min || 13}-{selected.eligibility_age_max || 19}
                </p>
                <p className="mt-1 text-sm text-black/75">Team size: Up to {selected.team_size_max || 8}</p>
                <p className="mt-1 text-sm text-black/75">Tags: {selected.relevance_tags || "general startup"}</p>
              </div>
              <div className="rounded-2xl border border-black/10 bg-white/80 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-black/45">Prep Notes</p>
                <textarea
                  className="mt-3 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm"
                  rows={5}
                  value={pipeline[selected.id]?.note || ""}
                  onChange={(event) => updatePipeline(selected.id, { note: event.target.value })}
                  placeholder="Capture prep plan, deadlines, and links."
                />
              </div>
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
                <p className="mt-2 text-xs text-black/60">{item.type || "Pitch"} · {item.audience || "Investors"}</p>
                <p className="mt-2 text-xs text-black/70">{summarizePitch(item)}</p>
                <p className="mt-3 text-lg font-semibold">{item.match_score || 0}% fit</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
