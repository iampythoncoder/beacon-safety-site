import { useMemo, useState } from "react";
import { PitchOpportunity } from "../lib/types";

export function PitchTable({ pitches }: { pitches: PitchOpportunity[] }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"relevance" | "name">("relevance");
  const [demoFilter, setDemoFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");

  const filtered = useMemo(() => {
    const base = pitches.filter((item) =>
      [item.name, item.type, item.audience, item.relevance_tags]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase())
    );

    const demoFiltered =
      demoFilter === "all"
        ? base
        : base.filter((item) => (demoFilter === "yes" ? item.requires_demo : !item.requires_demo));
    const planFiltered =
      planFilter === "all"
        ? demoFiltered
        : demoFiltered.filter((item) => (planFilter === "yes" ? item.requires_plan : !item.requires_plan));

    if (sort === "name") {
      return [...planFiltered].sort((a, b) => a.name.localeCompare(b.name));
    }

    return [...planFiltered].sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
  }, [pitches, search, sort, demoFilter, planFilter]);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-xl">Pitch Opportunities</h2>
          <p className="text-sm text-black/60 mt-1">Filter demo days and pitch events.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 max-w-full">
          <input
            className="rounded-full border border-black/10 px-3 py-1 text-sm min-w-0"
            placeholder="Search pitches"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            className="rounded-full border border-black/10 px-3 py-1 text-sm max-w-full"
            value={demoFilter}
            onChange={(event) => setDemoFilter(event.target.value)}
          >
            <option value="all">Demo: all</option>
            <option value="yes">Demo: yes</option>
            <option value="no">Demo: no</option>
          </select>
          <select
            className="rounded-full border border-black/10 px-3 py-1 text-sm max-w-full"
            value={planFilter}
            onChange={(event) => setPlanFilter(event.target.value)}
          >
            <option value="all">Plan: all</option>
            <option value="yes">Plan: yes</option>
            <option value="no">Plan: no</option>
          </select>
          <select
            className="rounded-full border border-black/10 px-3 py-1 text-sm max-w-full"
            value={sort}
            onChange={(event) => setSort(event.target.value as "relevance" | "name")}
          >
            <option value="relevance">Sort: relevance</option>
            <option value="name">Sort: name</option>
          </select>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="text-left text-black/60">
              <th className="py-2">Name</th>
              <th className="py-2">Type</th>
              <th className="py-2">Audience</th>
              <th className="py-2">Demo</th>
              <th className="py-2">Plan</th>
              <th className="py-2">Eligibility</th>
              <th className="py-2">Score</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-t border-black/5">
                <td className="py-3 pr-4">
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-black/50">{item.how_to_apply || ""}</div>
                  {item.explanation && <div className="text-black/50 mt-1">{item.explanation}</div>}
                </td>
                <td className="py-3 pr-4">{item.type}</td>
                <td className="py-3 pr-4">{item.audience}</td>
                <td className="py-3 pr-4">{item.requires_demo ? "Yes" : "No"}</td>
                <td className="py-3 pr-4">{item.requires_plan ? "Yes" : "No"}</td>
                <td className="py-3 pr-4">{item.eligibility_age_min}-{item.eligibility_age_max}</td>
                <td className="py-3 pr-4 font-semibold">{item.relevance_score ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
