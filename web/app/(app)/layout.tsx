"use client";

import { useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { supabase } from "../../lib/supabaseClient";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function gate() {
      const session = await supabase.auth.getSession();
      const userId = session.data.session?.user?.id;
      if (!userId) {
        window.location.href = "/login";
        return;
      }
      const res = await fetch(`/api/onboarding/status?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (!data?.has_completed_onboarding) {
          window.location.href = "/onboarding";
          return;
        }
      }
      setChecked(true);
    }
    gate();
  }, []);

  if (!checked) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#F6F1EA] text-ink">
        <div className="card p-6">Loading your workspace…</div>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
