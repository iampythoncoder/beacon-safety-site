"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { withAuthHeaders } from "../../../lib/authFetch";

type MentorSummary = {
  summary?: string;
  next_steps?: string[];
  pitfalls?: string[];
};

type Message = { role: "user" | "assistant"; content: string };

export default function MentorPage() {
  const [userId, setUserId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [projectName, setProjectName] = useState("Founder Project");
  const [projectContext, setProjectContext] = useState("");
  const [mentor, setMentor] = useState<MentorSummary>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [planStatus, setPlanStatus] = useState("inactive");
  const endRef = useRef<HTMLDivElement | null>(null);

  const quickPrompts = useMemo(
    () => [
      "What should I ship this week to raise my startup score?",
      "Give me a concrete 7-day traction sprint.",
      "What should I improve before submitting to competitions?",
      "Help me prioritize roadmap tasks for fastest progress."
    ],
    []
  );

  useEffect(() => {
    async function load() {
      const session = await supabase.auth.getSession();
      const sessionUserId = session.data.session?.user?.id;
      if (!sessionUserId) return;
      setUserId(sessionUserId);
      const billingHeaders = await withAuthHeaders();
      const billingRes = await fetch("/api/stripe/status", { method: "GET", headers: billingHeaders });
      if (billingRes.ok) {
        const billing = await billingRes.json();
        setIsPro(Boolean(billing?.is_pro));
        setPlanStatus(String(billing?.plan_status || "inactive"));
      }

      setReady(false);
      const projectRes = await fetch(`/api/projects/latest?user_id=${sessionUserId}`);
      if (!projectRes.ok) {
        setError("Failed to load project context.");
        setReady(true);
        return;
      }

      const project = await projectRes.json();
      if (!project?.id) {
        setReady(true);
        return;
      }

      setProjectId(project.id || "");
      setProjectName(project.name || "Founder Project");
      setProjectContext(
        [
          project.domain ? `Domain: ${project.domain}` : "",
          project.stage ? `Stage: ${project.stage}` : "",
          project.goal ? `Goal: ${project.goal}` : "",
          project.timeline_available_weeks ? `Timeline: ${project.timeline_available_weeks} weeks` : "",
          project.team_size ? `Team size: ${project.team_size}` : ""
        ]
          .filter(Boolean)
          .join(" · ")
      );

      const planRes = await fetch(`/api/plan?project_id=${project.id}&user_id=${sessionUserId}`);
      if (planRes.ok) {
        const plan = await planRes.json();
        setMentor(plan?.plan?.mentor_summary || {});
      }

      setReady(true);
    }

    load();
  }, []);

  const storageKey = useMemo(() => {
    if (!userId) return "";
    return `launchlab:mentor:chat:${userId}:${projectId || "none"}`;
  }, [userId, projectId]);

  useEffect(() => {
    if (!storageKey) return;
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      const sanitized = parsed
        .filter((item) => item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string")
        .slice(-80);
      setMessages(sanitized);
    } catch {
      // Ignore malformed local state.
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    window.localStorage.setItem(storageKey, JSON.stringify(messages.slice(-80)));
  }, [messages, storageKey]);

  useEffect(() => {
    if (!endRef.current) return;
    endRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function sendMessage(prefilled?: string) {
    if (!isPro) {
      setError("LaunchLab Pro required for AI mentor.");
      window.location.href = "/upgrade";
      return;
    }
    const text = (prefilled ?? input).trim();
    if (!text) return;
    const nextMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError("");

    const context = [
      "You are LaunchLab AI Mentor for ambitious high school founders.",
      "Keep advice concrete, tactical, and milestone-driven.",
      projectName ? `Project name: ${projectName}` : "",
      projectContext ? `Project profile: ${projectContext}` : "",
      mentor.summary ? `Mentor summary: ${mentor.summary}` : "",
      mentor.next_steps?.length ? `Next steps context: ${mentor.next_steps.join(" | ")}` : "",
      mentor.pitfalls?.length ? `Known pitfalls: ${mentor.pitfalls.join(" | ")}` : ""
    ]
      .filter(Boolean)
      .join("\n");

    const headers = await withAuthHeaders({ "Content-Type": "application/json" });
    const res = await fetch("/api/groq/chat", {
      method: "POST",
      headers,
      body: JSON.stringify({
        messages: [{ role: "system", content: context }, ...nextMessages]
      })
    });

    if (res.status === 402) {
      setError("LaunchLab Pro required for AI mentor. Redirecting to upgrade...");
      window.location.href = "/upgrade";
      setLoading(false);
      return;
    }

    if (res.ok) {
      const data = await res.json();
      setMessages([...nextMessages, { role: "assistant", content: data.message }]);
    } else {
      const payload = await res.json().catch(() => ({}));
      setError(payload?.error || "Failed to send message.");
    }

    setLoading(false);
  }

  function clearChat() {
    setMessages([]);
    if (storageKey) window.localStorage.removeItem(storageKey);
  }

  return (
    <div className="os-page space-y-6">
      <section className="card p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-black/45">AI Mentor Chat</p>
            <h2 className="mt-3 text-4xl font-semibold tracking-tight">{projectName}</h2>
            <p className="mt-3 text-black/65 max-w-3xl">
              Dedicated mentor workspace for tactical startup execution. Ask for milestones, strategy, pitch edits,
              and blockers.
            </p>
            {projectContext && <p className="mt-2 text-xs text-black/55">{projectContext}</p>}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-[11px] uppercase tracking-[0.18em] ${
                isPro ? "bg-emerald-600 text-white" : "bg-amber-100 text-amber-900"
              }`}
            >
              {isPro ? "PRO" : `FREE (${planStatus})`}
            </span>
            <button
              className="px-4 py-2 rounded-full border border-black/15 bg-white/85 text-sm"
              onClick={clearChat}
              disabled={messages.length === 0 || !isPro}
            >
              Clear chat
            </button>
          </div>
        </div>
      </section>

      <section className="card p-6">
        {!isPro && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            AI mentor is a Pro feature. Upgrade to unlock full chat.
            <a href="/upgrade" className="ml-2 underline font-medium">
              Upgrade now
            </a>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              className="rounded-full border border-black/12 bg-white/80 px-4 py-2 text-xs text-black/72 transition hover:bg-black hover:text-white"
              onClick={() => sendMessage(prompt)}
              disabled={loading || !isPro}
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="mt-4 h-[60vh] min-h-[460px] overflow-auto rounded-3xl border border-black/10 bg-white/80 p-5 space-y-3">
          {!ready ? (
            <p className="text-sm text-black/55">Loading mentor context…</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-black/60">Start by asking for your next 7-day execution sprint.</p>
          ) : (
            messages.map((msg, index) => (
              <div
                key={`${msg.role}-${index}`}
                className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user" ? "bg-black text-white ml-auto" : "bg-white border border-black/10"
                }`}
              >
                {msg.content}
              </div>
            ))
          )}
          {loading && (
            <div className="max-w-[90%] rounded-2xl px-4 py-3 text-sm bg-white border border-black/10 text-black/70">
              Thinking…
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="mt-4 flex gap-2">
          <textarea
            className="flex-1 rounded-2xl border border-black/10 bg-white/86 px-4 py-3 text-sm min-h-[60px]"
            placeholder={isPro ? "Ask the mentor..." : "Upgrade to Pro to use AI mentor chat"}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
              }
            }}
            disabled={!isPro}
          />
          <button
            className="self-end px-5 py-2.5 rounded-full bg-ink text-white text-sm"
            onClick={() => sendMessage()}
            disabled={loading || !isPro}
          >
            {loading ? "Sending…" : "Send"}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        {!projectId && ready && <p className="mt-2 text-sm text-black/55">No project yet. Complete onboarding first.</p>}
      </section>
    </div>
  );
}
