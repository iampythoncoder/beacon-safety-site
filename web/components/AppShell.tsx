"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

const navItems = [
  { href: "/overview", label: "Overview" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/competitions", label: "Competitions" },
  { href: "/pitches", label: "Pitches" },
  { href: "/plan", label: "Plan" },
  { href: "/mentor", label: "Mentor" },
  { href: "/progress", label: "Progress" },
  { href: "/feedback", label: "Feedback" }
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState<string>("");
  const [projectName, setProjectName] = useState<string>("Your Startup");
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
            <div className="os-user-pill">{email || "Signed in"}</div>
          </header>
          <div className="os-content">{children}</div>
        </main>
      </div>
    </div>
  );
}
