"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { withAuthHeaders } from "../../../lib/authFetch";

type BillingStatus = {
  plan: string;
  plan_status: string;
  is_pro: boolean;
};

export default function UpgradePage() {
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [error, setError] = useState("");

  async function loadBillingStatus() {
    const headers = await withAuthHeaders();
    const res = await fetch("/api/stripe/status", { method: "GET", headers });
    if (!res.ok) return;
    const payload = await res.json();
    setBilling(payload);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session?.user?.id) {
        window.location.href = "/login";
        return;
      }
      loadBillingStatus();
    });
  }, []);

  async function upgradeToPro() {
    setLoadingCheckout(true);
    setError("");
    const headers = await withAuthHeaders({ "Content-Type": "application/json" });
    const res = await fetch("/api/stripe/create-checkout-session", {
      method: "POST",
      headers
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok || !payload?.url) {
      setError(payload?.error || "Unable to start checkout.");
      setLoadingCheckout(false);
      return;
    }
    window.location.href = payload.url;
  }

  async function openBillingPortal() {
    setLoadingPortal(true);
    setError("");
    const headers = await withAuthHeaders({ "Content-Type": "application/json" });
    const res = await fetch("/api/stripe/create-portal-session", {
      method: "POST",
      headers
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok || !payload?.url) {
      setError(payload?.error || "Unable to open billing portal.");
      setLoadingPortal(false);
      return;
    }
    window.location.href = payload.url;
  }

  const isPro = Boolean(billing?.is_pro);

  return (
    <div className="os-page space-y-6">
      <section className="card p-8">
        <p className="text-xs uppercase tracking-[0.32em] text-black/45">LaunchLab Pro</p>
        <h2 className="mt-3 text-4xl font-semibold tracking-tight">Upgrade to unlock AI execution engine</h2>
        <p className="mt-3 text-black/65 max-w-3xl">
          Pro includes AI mentor chat, AI roadmap regeneration, AI best-match reasoning, and AI business-plan generation.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="card p-7">
          <p className="text-xs uppercase tracking-[0.28em] text-black/45">Free</p>
          <p className="mt-3 text-3xl font-semibold">$0</p>
          <p className="mt-2 text-sm text-black/62">Core workspace with manual progress tracking.</p>
          <ul className="mt-4 space-y-2 text-sm text-black/72">
            <li>- Roadmap/task workspace</li>
            <li>- Competitions and pitches browsing</li>
            <li>- Progress logging + validation tracking</li>
          </ul>
        </article>

        <article className="card p-7 border-2 border-black/20">
          <p className="text-xs uppercase tracking-[0.28em] text-black/45">Pro</p>
          <p className="mt-3 text-3xl font-semibold">$5/month</p>
          <p className="mt-2 text-sm text-black/62">AI-powered planning and execution acceleration.</p>
          <ul className="mt-4 space-y-2 text-sm text-black/72">
            <li>- AI mentor full chat</li>
            <li>- AI roadmap generation/regeneration</li>
            <li>- AI best-match reasoning for competitions/pitches</li>
            <li>- AI plan generation + scoring updates</li>
          </ul>

          <div className="mt-6 flex flex-wrap gap-3">
            {!isPro ? (
              <button
                className="px-5 py-2.5 rounded-full bg-ink text-white text-sm"
                onClick={upgradeToPro}
                disabled={loadingCheckout}
              >
                {loadingCheckout ? "Redirecting…" : "Upgrade to Pro"}
              </button>
            ) : (
              <button
                className="px-5 py-2.5 rounded-full border border-black/15 bg-white/90 text-sm"
                onClick={openBillingPortal}
                disabled={loadingPortal}
              >
                {loadingPortal ? "Opening…" : "Manage billing"}
              </button>
            )}
            <span className="px-3 py-1 rounded-full border border-black/12 text-xs uppercase tracking-[0.18em] text-black/60">
              {billing?.plan?.toUpperCase() || "FREE"} · {billing?.plan_status || "inactive"}
            </span>
          </div>
        </article>
      </section>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
