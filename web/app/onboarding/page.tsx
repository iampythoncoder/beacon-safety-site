"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { withAuthHeaders } from "../../lib/authFetch";

const ideaStageOptions = [
  "Just a rough idea",
  "I know the problem, not the solution",
  "I have a solution in mind",
  "I’ve started building",
  "I’m just exploring"
];

const domainOptions = [
  "AI / ML",
  "Climate / sustainability",
  "Health / biotech",
  "Education",
  "Social impact",
  "Consumer app",
  "Hardware",
  "Research-based",
  "Not sure yet"
];

const goalOptions = [
  "Win competitions",
  "Build a real product",
  "Prepare for college applications",
  "Get funding or accelerator-ready",
  "Learn startup skills",
  "Not sure yet"
];

const experienceOptions = [
  "No coding or startup experience",
  "Some coding",
  "Built projects before",
  "Done competitions before"
];

const timelineOptions = [
  "ASAP (1–2 weeks)",
  "1 month",
  "3+ months",
  "No deadline"
];

const surveySteps = [
  "ideaStage",
  "domains",
  "primaryGoal",
  "experience",
  "timeline",
  "ideaSentence"
] as const;

type SurveyState = {
  ideaStage: string;
  domains: string[];
  primaryGoal: string;
  experience: string;
  timeline: string;
  ideaSentence: string;
};

const initialSurvey: SurveyState = {
  ideaStage: "",
  domains: [],
  primaryGoal: "",
  experience: "",
  timeline: "",
  ideaSentence: ""
};

function deriveStage(ideaStage: string) {
  if (ideaStage.includes("started building")) return "Prototype";
  if (ideaStage.includes("solution")) return "Ideation";
  if (ideaStage.includes("problem")) return "Ideation";
  return "Exploration";
}

function deriveTimelineWeeks(timeline: string) {
  if (timeline.startsWith("ASAP")) return 2;
  if (timeline.startsWith("1 month")) return 4;
  if (timeline.startsWith("3+")) return 12;
  return 8;
}

function projectNameFromSentence(sentence: string) {
  if (!sentence.trim()) return "Untitled Startup";
  const words = sentence.replace(/[^a-zA-Z0-9\s]/g, "").split(" ").filter(Boolean);
  return words.slice(0, 3).join(" ") || "Untitled Startup";
}

export default function OnboardingPage() {
  const [session, setSession] = useState<any>(null);
  const [survey, setSurvey] = useState<SurveyState>(initialSurvey);
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function checkStatus() {
      if (!session?.user?.id) return;
      const statusRes = await fetch(`/api/onboarding/status?user_id=${session.user.id}`);
      if (statusRes.ok) {
        const status = await statusRes.json();
        if (status?.has_completed_onboarding) {
          window.location.href = "/overview";
        }
      }
    }
    checkStatus();
  }, [session]);

  function updateMultiSelect(option: string) {
    setSurvey((prev) => {
      const exists = prev.domains.includes(option);
      return {
        ...prev,
        domains: exists ? prev.domains.filter((d) => d !== option) : [...prev.domains, option]
      };
    });
  }

  async function handleSubmitSurvey() {
    if (!session?.user?.id) return;
    setLoading(true);
    setSubmitError("");

    const projectInput = {
      user_id: session.user.id,
      project_name: projectNameFromSentence(survey.ideaSentence),
      project_description: survey.ideaSentence || "An early-stage student startup idea.",
      domain: survey.domains.join(", ") || "Exploration",
      stage: deriveStage(survey.ideaStage),
      team_size: 1,
      skills_available: [],
      demo_built: survey.ideaStage.includes("started building"),
      target_user_age_range: "14-18",
      timeline_available_weeks: deriveTimelineWeeks(survey.timeline),
      goal: survey.primaryGoal || "Explore startup execution",
      additional_notes: `Experience: ${survey.experience}.`
    };

    try {
      const headers = await withAuthHeaders({ "Content-Type": "application/json" });
      const res = await fetch("/api/generate/plan", {
        method: "POST",
        headers,
        body: JSON.stringify({ user_id: session.user.id, project: projectInput, onboarding: survey })
      });
      if (res.status === 402) {
        window.location.href = "/upgrade";
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to generate plan");
      }
      window.location.href = "/overview";
    } catch (err: any) {
      setSubmitError(err.message || "Failed to submit onboarding");
    } finally {
      setLoading(false);
    }
  }

  if (!session?.user) {
    return (
      <main className="gradient-bg min-h-screen px-6 py-12">
        <section className="max-w-2xl mx-auto card p-8 text-center">
          <h1 className="section-title">Please sign in first</h1>
          <p className="text-sm text-black/60 mt-2">You need an account to start onboarding.</p>
          <a className="inline-flex mt-6 px-5 py-2 rounded-full bg-ink text-white text-sm" href="/signup">
            Go to signup
          </a>
        </section>
      </main>
    );
  }

  const progress = ((stepIndex + 1) / surveySteps.length) * 100;

  return (
    <main className="gradient-bg min-h-screen px-6 py-12">
      <section className="max-w-3xl mx-auto card p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="section-title">Startup onboarding</h1>
            <p className="text-sm text-black/60">One question at a time. Let’s build your plan.</p>
          </div>
          <div className="text-xs text-black/50">Step {stepIndex + 1} of {surveySteps.length}</div>
        </div>
        <div className="h-2 rounded-full bg-black/5 overflow-hidden">
          <div className="h-full bg-ink" style={{ width: `${progress}%` }} />
        </div>

        {surveySteps[stepIndex] === "ideaStage" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">What best describes your idea right now?</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {ideaStageOptions.map((option) => (
                <button
                  key={option}
                  className={`rounded-2xl border px-4 py-3 text-sm text-left ${
                    survey.ideaStage === option ? "border-ink bg-sand/60" : "border-black/10"
                  }`}
                  onClick={() => setSurvey({ ...survey, ideaStage: option })}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {surveySteps[stepIndex] === "domains" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">What space does your idea fall into?</h3>
            <div className="grid gap-3 md:grid-cols-3">
              {domainOptions.map((option) => (
                <button
                  key={option}
                  className={`rounded-2xl border px-4 py-3 text-sm text-left ${
                    survey.domains.includes(option) ? "border-ink bg-sand/60" : "border-black/10"
                  }`}
                  onClick={() => updateMultiSelect(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {surveySteps[stepIndex] === "primaryGoal" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">What do you want to get out of this?</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {goalOptions.map((option) => (
                <button
                  key={option}
                  className={`rounded-2xl border px-4 py-3 text-sm text-left ${
                    survey.primaryGoal === option ? "border-ink bg-sand/60" : "border-black/10"
                  }`}
                  onClick={() => setSurvey({ ...survey, primaryGoal: option })}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {surveySteps[stepIndex] === "experience" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">What’s your experience level?</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {experienceOptions.map((option) => (
                <button
                  key={option}
                  className={`rounded-2xl border px-4 py-3 text-sm text-left ${
                    survey.experience === option ? "border-ink bg-sand/60" : "border-black/10"
                  }`}
                  onClick={() => setSurvey({ ...survey, experience: option })}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {surveySteps[stepIndex] === "timeline" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">When do you want results?</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {timelineOptions.map((option) => (
                <button
                  key={option}
                  className={`rounded-2xl border px-4 py-3 text-sm text-left ${
                    survey.timeline === option ? "border-ink bg-sand/60" : "border-black/10"
                  }`}
                  onClick={() => setSurvey({ ...survey, timeline: option })}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {surveySteps[stepIndex] === "ideaSentence" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">In one sentence, what’s your idea?</h3>
            <textarea
              className="w-full rounded-2xl border border-black/10 px-4 py-3"
              rows={3}
              placeholder="Optional — you can skip this for now"
              value={survey.ideaSentence}
              onChange={(event) => setSurvey({ ...survey, ideaSentence: event.target.value })}
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            className="text-sm text-black/60"
            onClick={() => setStepIndex((prev) => Math.max(prev - 1, 0))}
            disabled={stepIndex === 0}
          >
            Back
          </button>
          {stepIndex < surveySteps.length - 1 ? (
            <button
              className="px-5 py-2 rounded-full bg-ink text-white text-sm"
              onClick={() => setStepIndex((prev) => prev + 1)}
            >
              Next
            </button>
          ) : (
            <button
              className="px-5 py-2 rounded-full bg-ink text-white text-sm"
              onClick={handleSubmitSurvey}
              disabled={loading}
            >
              {loading ? "Building your personalized startup roadmap…" : "Create My Startup Plan"}
            </button>
          )}
        </div>
        {submitError && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-3 text-xs text-red-600">
            {submitError}
          </div>
        )}
      </section>
    </main>
  );
}
