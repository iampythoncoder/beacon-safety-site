"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function FeedbackPage() {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  async function submit() {
    const session = await supabase.auth.getSession();
    const userId = session.data.session?.user?.id;
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, message, page: "feedback" })
    });
    if (res.ok) setSent(true);
  }

  return (
    <div className="os-page space-y-6">
      <section className="card p-8">
        <p className="text-xs uppercase tracking-[0.32em] text-black/45">Feedback</p>
        <h2 className="mt-3 text-4xl font-semibold tracking-tight">Report bugs and request improvements</h2>
        <p className="mt-3 text-black/65 max-w-2xl">
          Share anything blocking your startup execution flow. Feedback is saved directly to the product queue.
        </p>
      </section>

      <section className="card p-6 space-y-3">
        {sent ? (
          <p className="text-sm text-black/72">Thanks, your feedback was submitted.</p>
        ) : (
          <>
            <textarea
              className="w-full rounded-2xl border border-black/10 bg-white/82 px-4 py-3 text-sm"
              rows={6}
              placeholder="What should we fix or improve?"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
            <button className="px-5 py-2.5 rounded-full bg-ink text-white text-sm" onClick={submit}>
              Send feedback
            </button>
          </>
        )}
      </section>
    </div>
  );
}
