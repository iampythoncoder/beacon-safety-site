export default function PricingPage() {
  return (
    <main className="gradient-bg min-h-screen px-6 py-12">
      <section className="max-w-5xl mx-auto">
        <div className="text-center space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-black/40">Pricing</p>
          <h1 className="hero-title">Simple, student-friendly pricing.</h1>
          <p className="text-lg text-black/60">
            $5 per plan + $3 per month. No hidden fees. Cancel anytime.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="card p-8 space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-black/40">Launch Plan</p>
            <p className="text-4xl font-semibold">$5</p>
            <p className="text-sm text-black/60">One-time per plan</p>
            <ul className="text-sm text-black/70 space-y-2">
              <li>AI idea rating and feasibility score</li>
              <li>Lean business plan</li>
              <li>Roadmap with weekly tasks</li>
              <li>Competition and pitch matching</li>
            </ul>
            <a className="inline-flex px-5 py-2 rounded-full bg-ink text-white text-sm" href="/auth">
              Start a plan
            </a>
          </div>
          <div className="card p-8 space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-black/40">Mentor Access</p>
            <p className="text-4xl font-semibold">$3</p>
            <p className="text-sm text-black/60">Per month</p>
            <ul className="text-sm text-black/70 space-y-2">
              <li>AI mentor guidance and feedback</li>
              <li>Progress tracking with unlocks</li>
              <li>Exportable plan summaries</li>
              <li>Team collaboration ready</li>
            </ul>
            <a className="inline-flex px-5 py-2 rounded-full border border-black/10 text-sm" href="/auth">
              Activate subscription
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
