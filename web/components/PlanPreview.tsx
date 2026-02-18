import { ProjectResponse } from "../lib/types";

export function PlanPreview({ project }: { project: ProjectResponse }) {
  const plan = project.lean_business_plan;
  const text = (value: unknown, fallback = "Not provided") =>
    typeof value === "string" && value.trim() ? value : fallback;
  const list = (value: unknown) => (Array.isArray(value) ? value.map((item) => String(item)).join(", ") : "Not provided");
  return (
    <div className="card p-6 space-y-4">
      <h2 className="section-title">Plan Summary Preview</h2>
      <p className="text-sm text-black/60">A detailed snapshot of the generated plan.</p>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 border border-black/5">
          <p className="text-xs uppercase tracking-[0.3em] text-black/40">Problem</p>
          <p className="text-sm text-black/70 mt-2">{text(plan.problem_statement)}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 border border-black/5">
          <p className="text-xs uppercase tracking-[0.3em] text-black/40">Solution</p>
          <p className="text-sm text-black/70 mt-2">{text(plan.solution_summary)}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 border border-black/5">
          <p className="text-xs uppercase tracking-[0.3em] text-black/40">Target User</p>
          <p className="text-sm text-black/70 mt-2">{text(plan.target_user)}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 border border-black/5">
          <p className="text-xs uppercase tracking-[0.3em] text-black/40">Success Metrics</p>
          <p className="text-sm text-black/70 mt-2">{list(plan.success_metrics)}</p>
        </div>
      </div>
      <div className="rounded-2xl bg-sand/60 p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-black/40">Key Features</p>
        <p className="text-sm text-black/70 mt-2">{list(plan.key_features)}</p>
      </div>
      <div className="rounded-2xl bg-sand/60 p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-black/40">Monetization</p>
        <p className="text-sm text-black/70 mt-2">{text(plan.monetization_strategy)}</p>
      </div>
    </div>
  );
}
