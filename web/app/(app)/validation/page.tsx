"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

type ValidationStatus = {
  interviews_target: number;
  interviews_done: number;
  surveys_target: number;
  surveys_done: number;
  waitlist_target: number;
  waitlist_count: number;
  milestone_ready: boolean;
  missing_requirements: string[];
  readiness_score: number;
  gating_note: string;
};

type ValidationEvent = {
  id: string;
  type: "interview" | "survey" | "waitlist";
  entry: string;
  created_at: string;
};

export default function ValidationPage() {
  const [projectId, setProjectId] = useState<string>("");
  const [status, setStatus] = useState("");
  const [validation, setValidation] = useState<ValidationStatus | null>(null);
  const [validationEvents, setValidationEvents] = useState<ValidationEvent[]>([]);

  const [interviewee, setInterviewee] = useState("");
  const [interviewSegment, setInterviewSegment] = useState("");
  const [interviewPainPoint, setInterviewPainPoint] = useState("");
  const [interviewUrgency, setInterviewUrgency] = useState(3);
  const [interviewLink, setInterviewLink] = useState("");
  const [interviewResult, setInterviewResult] = useState("");

  const [surveyTitle, setSurveyTitle] = useState("");
  const [surveyTarget, setSurveyTarget] = useState("");
  const [surveyQuestions, setSurveyQuestions] = useState("What is your biggest pain point right now?");
  const [surveyGoal, setSurveyGoal] = useState(20);
  const [surveyLink, setSurveyLink] = useState("");

  const [waitlistCount, setWaitlistCount] = useState(0);
  const [waitlistSource, setWaitlistSource] = useState("");
  const [waitlistNotes, setWaitlistNotes] = useState("");
  const [waitlistLink, setWaitlistLink] = useState("");

  async function refreshValidation(id: string) {
    const validationRes = await fetch(`/api/validation?project_id=${id}`);
    if (!validationRes.ok) return;
    const data = await validationRes.json();
    setValidation(data?.status || null);
    setValidationEvents(Array.isArray(data?.events) ? data.events : []);
    const currentWaitlist = Number(data?.status?.waitlist_count || 0);
    if (Number.isFinite(currentWaitlist)) setWaitlistCount(currentWaitlist);
  }

  useEffect(() => {
    async function load() {
      const session = await supabase.auth.getSession();
      const userId = session.data.session?.user?.id;
      if (!userId) return;
      const projectRes = await fetch(`/api/projects/latest?user_id=${userId}`);
      if (!projectRes.ok) return;
      const project = await projectRes.json();
      if (!project?.id) {
        setStatus("No project found. Complete onboarding first.");
        return;
      }
      setProjectId(project.id);
      await refreshValidation(project.id);
    }
    load();
  }, []);

  async function saveInterview() {
    if (!projectId) return;
    const session = await supabase.auth.getSession();
    const userId = session.data.session?.user?.id;
    const res = await fetch("/api/validation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        user_id: userId,
        action: "interview",
        links: interviewLink,
        data: {
          interviewee,
          segment: interviewSegment,
          pain_point: interviewPainPoint,
          urgency: interviewUrgency,
          results: interviewResult
        }
      })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setStatus(data?.error || "Failed to save interview.");
      return;
    }
    const data = await res.json();
    setValidation(data?.status || null);
    setValidationEvents(Array.isArray(data?.events) ? data.events : []);
    setInterviewee("");
    setInterviewSegment("");
    setInterviewPainPoint("");
    setInterviewUrgency(3);
    setInterviewLink("");
    setInterviewResult("");
    setStatus("Interview logged.");
  }

  async function saveSurvey() {
    if (!projectId) return;
    const questions = surveyQuestions
      .split("\n")
      .map((question) => question.trim())
      .filter(Boolean);
    if (!surveyTitle.trim() || questions.length === 0) {
      setStatus("Survey title and at least one question are required.");
      return;
    }
    const session = await supabase.auth.getSession();
    const userId = session.data.session?.user?.id;
    const res = await fetch("/api/validation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        user_id: userId,
        action: "survey",
        links: surveyLink,
        data: {
          title: surveyTitle,
          target_segment: surveyTarget,
          response_goal: surveyGoal,
          questions
        }
      })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setStatus(data?.error || "Failed to save survey.");
      return;
    }
    const data = await res.json();
    setValidation(data?.status || null);
    setValidationEvents(Array.isArray(data?.events) ? data.events : []);
    setStatus("Survey saved.");
  }

  async function saveWaitlist() {
    if (!projectId) return;
    const session = await supabase.auth.getSession();
    const userId = session.data.session?.user?.id;
    const res = await fetch("/api/validation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: projectId,
        user_id: userId,
        action: "waitlist",
        links: waitlistLink,
        data: {
          waitlist_count: waitlistCount,
          source: waitlistSource,
          notes: waitlistNotes
        }
      })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setStatus(data?.error || "Failed to update waitlist.");
      return;
    }
    const data = await res.json();
    setValidation(data?.status || null);
    setValidationEvents(Array.isArray(data?.events) ? data.events : []);
    setStatus("Waitlist updated.");
  }

  const interviewsPct = validation
    ? Math.min(100, Math.round((validation.interviews_done / Math.max(1, validation.interviews_target)) * 100))
    : 0;
  const surveysPct = validation
    ? Math.min(100, Math.round((validation.surveys_done / Math.max(1, validation.surveys_target)) * 100))
    : 0;
  const waitlistPct = validation
    ? Math.min(100, Math.round((validation.waitlist_count / Math.max(1, validation.waitlist_target)) * 100))
    : 0;

  return (
    <div className="os-page space-y-6">
      <section className="card p-8">
        <p className="text-xs uppercase tracking-[0.32em] text-black/45">Validation Lab</p>
        <h2 className="mt-3 text-4xl font-semibold tracking-tight">Force real validation before build</h2>
        <p className="mt-3 text-black/65 max-w-2xl">
          Roadmap unlocks are now tied to proof: interviews, survey evidence, and waitlist traction.
        </p>
        {status && <p className="mt-3 text-sm text-black/60">{status}</p>}
      </section>

      <section className="card p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-black/40">Validation Milestone Gating</p>
            <p className="mt-2 text-lg font-semibold">Build/launch stages unlock only after proof</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-[11px] uppercase tracking-[0.18em] ${
              validation?.milestone_ready ? "bg-emerald-600 text-white" : "bg-amber-100 text-amber-900"
            }`}
          >
            {validation?.milestone_ready ? "Gate passed" : "Gate locked"}
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-black/10 bg-white/82 p-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-black/45">Interviews</p>
            <p className="mt-2 text-2xl font-semibold">
              {validation?.interviews_done || 0}/{validation?.interviews_target || 5}
            </p>
            <div className="mt-2 h-2 rounded-full bg-black/10 overflow-hidden">
              <span className="block h-full bg-black" style={{ width: `${interviewsPct}%` }} />
            </div>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white/82 p-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-black/45">Surveys</p>
            <p className="mt-2 text-2xl font-semibold">
              {validation?.surveys_done || 0}/{validation?.surveys_target || 1}
            </p>
            <div className="mt-2 h-2 rounded-full bg-black/10 overflow-hidden">
              <span className="block h-full bg-black" style={{ width: `${surveysPct}%` }} />
            </div>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white/82 p-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-black/45">Waitlist</p>
            <p className="mt-2 text-2xl font-semibold">
              {validation?.waitlist_count || 0}/{validation?.waitlist_target || 20}
            </p>
            <div className="mt-2 h-2 rounded-full bg-black/10 overflow-hidden">
              <span className="block h-full bg-black" style={{ width: `${waitlistPct}%` }} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white/80 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-black/45">Gate status</p>
          <p className="mt-2 text-sm text-black/75">
            {validation?.gating_note ||
              "Track interviews, publish a survey, and grow a waitlist to unlock downstream roadmap stages."}
          </p>
          {validation && validation.missing_requirements.length > 0 && (
            <div className="mt-3 space-y-2">
              {validation.missing_requirements.map((item) => (
                <div key={item} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="card p-6 space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-black/40">User Interview Tracker</p>
          <input
            className="w-full rounded-2xl border border-black/10 bg-white/82 px-4 py-3 text-sm"
            placeholder="Interviewee name"
            value={interviewee}
            onChange={(event) => setInterviewee(event.target.value)}
          />
          <input
            className="w-full rounded-2xl border border-black/10 bg-white/82 px-4 py-3 text-sm"
            placeholder="Segment (e.g. high school creators)"
            value={interviewSegment}
            onChange={(event) => setInterviewSegment(event.target.value)}
          />
          <input
            className="w-full rounded-2xl border border-black/10 bg-white/82 px-4 py-3 text-sm"
            placeholder="Top pain point discovered"
            value={interviewPainPoint}
            onChange={(event) => setInterviewPainPoint(event.target.value)}
          />
          <div>
            <p className="text-xs text-black/55">Urgency (1-5)</p>
            <input
              type="range"
              min={1}
              max={5}
              value={interviewUrgency}
              onChange={(event) => setInterviewUrgency(Number(event.target.value))}
              className="w-full"
            />
          </div>
          <input
            className="w-full rounded-2xl border border-black/10 bg-white/82 px-4 py-3 text-sm"
            placeholder="Evidence link (notes/doc)"
            value={interviewLink}
            onChange={(event) => setInterviewLink(event.target.value)}
          />
          <input
            className="w-full rounded-2xl border border-black/10 bg-white/82 px-4 py-3 text-sm"
            placeholder="Interview takeaway/result"
            value={interviewResult}
            onChange={(event) => setInterviewResult(event.target.value)}
          />
          <button className="px-5 py-2.5 rounded-full bg-ink text-white text-sm" onClick={saveInterview}>
            Save interview
          </button>
        </div>

        <div className="card p-6 space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-black/40">Survey Builder</p>
          <input
            className="w-full rounded-2xl border border-black/10 bg-white/82 px-4 py-3 text-sm"
            placeholder="Survey title"
            value={surveyTitle}
            onChange={(event) => setSurveyTitle(event.target.value)}
          />
          <input
            className="w-full rounded-2xl border border-black/10 bg-white/82 px-4 py-3 text-sm"
            placeholder="Target segment"
            value={surveyTarget}
            onChange={(event) => setSurveyTarget(event.target.value)}
          />
          <textarea
            className="w-full rounded-2xl border border-black/10 bg-white/82 px-4 py-3 text-sm"
            rows={5}
            placeholder={"One question per line\nWhat is your biggest pain point?\nWhat do you currently use?\nHow urgent is this problem?"}
            value={surveyQuestions}
            onChange={(event) => setSurveyQuestions(event.target.value)}
          />
          <input
            type="number"
            min={1}
            className="w-full rounded-2xl border border-black/10 bg-white/82 px-4 py-3 text-sm"
            placeholder="Response goal"
            value={surveyGoal}
            onChange={(event) => setSurveyGoal(Number(event.target.value))}
          />
          <input
            className="w-full rounded-2xl border border-black/10 bg-white/82 px-4 py-3 text-sm"
            placeholder="Survey link"
            value={surveyLink}
            onChange={(event) => setSurveyLink(event.target.value)}
          />
          <button className="px-5 py-2.5 rounded-full bg-ink text-white text-sm" onClick={saveSurvey}>
            Save survey
          </button>
        </div>

        <div className="card p-6 space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-black/40">Early User Waitlist Tracker</p>
          <input
            type="number"
            min={0}
            className="w-full rounded-2xl border border-black/10 bg-white/82 px-4 py-3 text-sm"
            placeholder="Current waitlist count"
            value={waitlistCount}
            onChange={(event) => setWaitlistCount(Number(event.target.value))}
          />
          <input
            className="w-full rounded-2xl border border-black/10 bg-white/82 px-4 py-3 text-sm"
            placeholder="Primary source (Reddit, school club, etc.)"
            value={waitlistSource}
            onChange={(event) => setWaitlistSource(event.target.value)}
          />
          <input
            className="w-full rounded-2xl border border-black/10 bg-white/82 px-4 py-3 text-sm"
            placeholder="Waitlist link"
            value={waitlistLink}
            onChange={(event) => setWaitlistLink(event.target.value)}
          />
          <textarea
            className="w-full rounded-2xl border border-black/10 bg-white/82 px-4 py-3 text-sm"
            rows={4}
            placeholder="Acquisition notes and conversion observations"
            value={waitlistNotes}
            onChange={(event) => setWaitlistNotes(event.target.value)}
          />
          <button className="px-5 py-2.5 rounded-full bg-ink text-white text-sm" onClick={saveWaitlist}>
            Update waitlist
          </button>
        </div>
      </section>

      <section className="card p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-black/40">Validation activity</p>
        <div className="mt-3 space-y-2 max-h-[280px] overflow-auto">
          {validationEvents.length === 0 ? (
            <p className="text-sm text-black/60">No validation events yet.</p>
          ) : (
            validationEvents.map((event) => (
              <div key={event.id} className="rounded-2xl border border-black/10 bg-white/82 p-3">
                <p className="text-sm text-black/78">{event.entry}</p>
                <p className="mt-1 text-xs text-black/58">
                  {event.type.toUpperCase()} · {new Date(event.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
