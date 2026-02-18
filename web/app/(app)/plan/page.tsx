"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { IdeaRatingPanel } from "../../../components/IdeaRatingPanel";
import { IdeaAspectFeedbackPanel } from "../../../components/IdeaAspectFeedbackPanel";

type Plan = {
  plan: any;
  version: number;
  created_at: string;
};

export default function PlanPage() {
  const [userId, setUserId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [history, setHistory] = useState<Array<{ id: string; version: number; created_at: string }>>([]);
  const [notes, setNotes] = useState("");
  const [saveStatus, setSaveStatus] = useState("");

  useEffect(() => {
    async function load() {
      const session = await supabase.auth.getSession();
      const sessionUserId = session.data.session?.user?.id;
      if (!sessionUserId) return;
      setUserId(sessionUserId);
      const projectRes = await fetch(`/api/projects/latest?user_id=${sessionUserId}`);
      if (!projectRes.ok) return;
      const project = await projectRes.json();
      if (!project?.id) return;
      setProjectId(project.id);

      const planRes = await fetch(`/api/plan?project_id=${project.id}&user_id=${sessionUserId}`);
      if (planRes.ok) {
        const data = await planRes.json();
        setPlan(data);
        setNotes(data?.plan?.notes || "");
      }
      const historyRes = await fetch(`/api/plan/history?project_id=${project.id}&user_id=${sessionUserId}`);
      if (historyRes.ok) setHistory(await historyRes.json());
    }
    load();
  }, []);

  async function saveVersion() {
    if (!projectId || !plan) return;
    setSaveStatus("");
    const payload = {
      ...plan.plan,
      notes
    };
    const res = await fetch("/api/plan/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, user_id: userId, plan: payload })
    });
    if (res.ok) {
      setSaveStatus("Saved new version.");
      const historyRes = await fetch(`/api/plan/history?project_id=${projectId}&user_id=${userId}`);
      if (historyRes.ok) setHistory(await historyRes.json());
    } else {
      setSaveStatus("Failed to save.");
    }
  }

  const planBody = useMemo(() => {
    return plan?.plan?.business_plan || plan?.plan?.lean_business_plan || plan?.plan || null;
  }, [plan]);

  return (
    <div className="os-page space-y-6">
      <section className="card p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-black/45">Business Plan</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">Live plan editor and version history</h2>
            <p className="mt-3 text-black/65 max-w-2xl">
              Update notes, export to PDF, and track how your idea rating evolves over versions.
            </p>
          </div>
          <button className="px-5 py-2.5 rounded-full bg-ink text-white text-sm" onClick={() => window.print()}>
            Export PDF
          </button>
        </div>
      </section>

      {!plan ? (
        <div className="card p-6 text-sm text-black/60">No plan yet. Complete onboarding to generate one.</div>
      ) : (
        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <div className="card p-7">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.3em] text-black/40">Version {plan.version}</p>
                <span className="text-xs text-black/50">{new Date(plan.created_at).toLocaleString()}</span>
              </div>
              <div className="mt-4 rounded-2xl border border-black/10 bg-white/75 p-4">
                <pre className="whitespace-pre-wrap text-sm text-black/75">
{JSON.stringify(planBody, null, 2)}
                </pre>
              </div>
            </div>

            <div className="card p-7">
              <p className="text-xs uppercase tracking-[0.3em] text-black/40">Founder notes</p>
              <textarea
                className="mt-3 w-full rounded-2xl border border-black/10 bg-white/82 px-4 py-3 text-sm"
                rows={5}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Capture updates, pivots, traction, and next decisions."
              />
              <div className="mt-3 flex items-center gap-3">
                <button className="px-5 py-2.5 rounded-full bg-ink text-white text-sm" onClick={saveVersion}>
                  Save new version
                </button>
                {saveStatus && <p className="text-xs text-black/55">{saveStatus}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-black/40">Detailed idea rating</p>
              <div className="mt-3">
                <IdeaRatingPanel
                  ideaRating={plan.plan?.idea_rating || {}}
                  details={plan.plan?.idea_rating_details || {}}
                  showHeader={false}
                />
              </div>
              <p className="mt-4 text-sm text-black/72">
                {plan.plan?.idea_feedback || "No detailed idea feedback yet."}
              </p>
            </div>

            <div className="card p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-black/40">Idea aspect feedback</p>
              <div className="mt-3">
                <IdeaAspectFeedbackPanel items={plan.plan?.idea_aspect_feedback || []} compact />
              </div>
            </div>

            <div className="card p-6">
              <p className="text-xs uppercase tracking-[0.3em] text-black/40">Version history</p>
              <div className="mt-4 space-y-2">
                {history.length === 0 ? (
                  <p className="text-sm text-black/60">No history yet.</p>
                ) : (
                  history.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm">
                      Version {item.version} · {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
