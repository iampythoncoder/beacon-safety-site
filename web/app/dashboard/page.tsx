"use client";

import { useEffect } from "react";

export default function DashboardPage() {
  useEffect(() => {
    window.location.href = "/overview";
  }, []);

  return (
    <main className="min-h-screen grid place-items-center bg-[#F6F1EA]">
      <div className="card p-6 text-sm text-black/60">Redirecting to overview…</div>
    </main>
  );
}
