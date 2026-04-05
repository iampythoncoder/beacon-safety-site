"use client";

import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { withAuthHeaders } from "../lib/authFetch";

const navItems = [
  { href: "/overview", label: "Overview" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/competitions", label: "Competitions" },
  { href: "/pitches", label: "Pitches" },
  { href: "/plan", label: "Plan" },
  { href: "/mentor", label: "Mentor" },
  { href: "/progress", label: "Progress" },
  { href: "/validation", label: "Validation" },
  { href: "/feedback", label: "Feedback" }
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState<string>("");
  const [projectName, setProjectName] = useState<string>("Your Startup");
  const [plan, setPlan] = useState<string>("free");
  const [planStatus, setPlanStatus] = useState<string>("inactive");
  const [isPro, setIsPro] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user?.email || "");
    });
  }, []);

  useEffect(() => {
    function handleScroll() {
      document.documentElement.style.setProperty("--scroll-y", `${window.scrollY}px`);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    async function loadProject() {
      const session = await supabase.auth.getSession();
      const userId = session.data.session?.user?.id;
      if (!userId) return;
      const res = await fetch(`/api/projects/latest?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.name) setProjectName(data.name);
      }
    }
    loadProject();
  }, []);

  useEffect(() => {
    async function loadBillingStatus() {
      const headers = await withAuthHeaders();
      const res = await fetch("/api/stripe/status", { method: "GET", headers });
      if (!res.ok) return;
      const payload = await res.json();
      setPlan((payload?.plan || "free").toLowerCase());
      setPlanStatus((payload?.plan_status || "inactive").toLowerCase());
      setIsPro(Boolean(payload?.is_pro));
    }
    loadBillingStatus();
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const commandItems = useMemo(() => {
    const query = commandQuery.trim().toLowerCase();
    if (!query) return navItems;
    return navItems.filter((item) => item.label.toLowerCase().includes(query) || item.href.includes(query));
  }, [commandQuery]);

  useEffect(() => {
    if (!commandOpen) setCommandQuery("");
  }, [commandOpen]);

  async function openBillingPortal() {
    setBillingLoading(true);
    const headers = await withAuthHeaders({ "Content-Type": "application/json" });
    const res = await fetch("/api/stripe/create-portal-session", {
      method: "POST",
      headers
    });
    const payload = await res.json().catch(() => ({}));
    setBillingLoading(false);
    if (!res.ok || !payload?.url) return;
    window.location.href = payload.url;
  }

  return (
    <div className="min-h-screen apple-bg text-ink">
      <div className="parallax-orb orb-one" />
      <div className="parallax-orb orb-two" />
      <div className="os-shell">
        <aside className="os-sidebar">
          <div className="os-brand">
            <span className="os-brand-mark">L</span>
            <div>
              <p className="os-brand-name">LaunchLab</p>
              <p className="os-brand-sub">Founder OS</p>
            </div>
          </div>
          <nav className="os-nav">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={clsx("os-nav-link", pathname === item.href && "is-active")}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="os-upgrade">
            <p className="os-upgrade-label">AI Mentor</p>
            <p className="os-upgrade-copy">Advanced mentor chats are available with paid subscription.</p>
          </div>
        </aside>

        <main className="os-main">
          <header className="os-topbar">
            <div>
              <p className="os-topbar-label">Project</p>
              <h1 className="os-topbar-title">{projectName}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1 rounded-full border border-black/15 bg-white/90 text-xs"
                onClick={() => setCommandOpen(true)}
              >
                Quick actions
              </button>
              <span
                className={`px-3 py-1 rounded-full text-[11px] uppercase tracking-[0.18em] ${
                  isPro ? "bg-emerald-600 text-white" : "bg-black/10 text-black/60"
                }`}
              >
                {isPro ? "PRO" : "FREE"}
              </span>
              {isPro ? (
                <button
                  className="px-3 py-1 rounded-full border border-black/15 bg-white/90 text-xs"
                  onClick={openBillingPortal}
                  disabled={billingLoading}
                >
                  {billingLoading ? "Opening…" : "Manage billing"}
                </button>
              ) : (
                <a className="px-3 py-1 rounded-full border border-black/15 bg-white/90 text-xs" href="/upgrade">
                  Upgrade
                </a>
              )}
              <div className="os-user-pill">
                {email || "Signed in"} · {planStatus}
              </div>
            </div>
          </header>
          <div className="os-content">{children}</div>
        </main>
      </div>

      {commandOpen && (
        <div className="fixed inset-0 z-[60] bg-black/35 backdrop-blur-sm px-4 py-10" onClick={() => setCommandOpen(false)}>
          <div
            className="mx-auto w-full max-w-xl rounded-3xl border border-black/12 bg-white p-4 shadow-[0_35px_80px_rgba(15,23,42,0.25)]"
            onClick={(event) => event.stopPropagation()}
          >
            <input
              autoFocus
              value={commandQuery}
              onChange={(event) => setCommandQuery(event.target.value)}
              placeholder="Jump to page..."
              className="w-full rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-sm"
            />
            <div className="mt-3 max-h-80 overflow-auto space-y-2">
              {commandItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => {
                    window.location.href = item.href;
                  }}
                  className="w-full rounded-xl border border-black/10 bg-white/80 px-4 py-3 text-left text-sm transition hover:border-black/20 hover:bg-white"
                >
                  <p className="font-medium">{item.label}</p>
                  <p className="mt-1 text-xs text-black/55">{item.href}</p>
                </button>
              ))}
              {commandItems.length === 0 && <p className="text-sm text-black/55 px-2 py-3">No matches found.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
