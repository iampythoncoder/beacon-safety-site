"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { createProject } from "../../lib/api";
import { ProjectInput } from "../../lib/types";

const achievements = [
  "Build a real product using modern tools",
  "Generate a competition-ready business plan",
  "Know exactly which pitch comps to apply to",
  "Prepare for accelerators and student VCs",
  "Stand out in college apps with proof, not ideas",
  "Track progress like a real startup"
];

const steps = [
  "Answer a few questions about your idea",
  "Receive a personalized startup roadmap",
  "Build step-by-step and update progress",
  "Get matched to competitions and next opportunities"
];

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

export default function AuthPage() {
  const [tab, setTab] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [session, setSession] = useState<any>(null);
  const [survey, setSurvey] = useState<SurveyState>(initialSurvey);
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleEmailAuth() {
    setAuthError("");
    if (!email || !password) return;
    const response =
      tab === "signup"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });
    if (response.error) setAuthError(response.error.message);
  }

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

    const projectInput: ProjectInput = {
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

    const payload = {
      ...projectInput,
      onboarding: survey
    } as any;

    const project = await createProject(payload);
    setProjectId(project.project_id);
    setLoading(false);
  }

  const isSignedIn = Boolean(session?.user);
  const progress = ((stepIndex + 1) / surveySteps.length) * 100;

  return (
    <main className="gradient-bg min-h-screen px-6 py-12">
      <section className="max-w-6xl mx-auto space-y-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.4em] text-black/40">LaunchLab</p>
            <h1 className="hero-title">Turn your idea into a real startup — step by step.</h1>
            <p className="text-lg text-black/60">
              LaunchLab guides high school founders from idea → build → competitions → funding.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <a className="px-6 py-3 rounded-full bg-ink text-white text-sm" href="#onboard">
                Start Building My Startup
              </a>
              <p className="text-xs text-black/50">Free to start · No experience required · Takes ~5 minutes</p>
            </div>
          </div>
          <div className="card p-6 space-y-4">
            <p className="text-xs uppercase tracking-[0.3em] text-black/40">Outcomes</p>
            <div className="grid gap-3">
              {achievements.map((achievement) => (
                <div key={achievement} className="rounded-2xl bg-sand/60 p-4 text-sm text-black/70">
                  {achievement}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <h2 className="section-title">How it works</h2>
            <p className="text-sm text-black/60 mt-2">Success feels inevitable when the steps are clear.</p>
            <ol className="mt-4 space-y-3 text-sm text-black/70">
              {steps.map((step, index) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="badge bg-sea text-white">{index + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
          <div className="card p-6">
            <h2 className="section-title">You don’t need</h2>
            <ul className="mt-4 space-y-2 text-sm text-black/70">
              <li>✕ No coding experience</li>
              <li>✕ No team</li>
              <li>✕ No finished idea</li>
              <li>✕ No money</li>
            </ul>
            <p className="text-sm text-black/60 mt-4">If you’re motivated, LaunchLab handles the structure.</p>
          </div>
        </div>

        <div className="text-center">
          <a className="px-6 py-3 rounded-full bg-ink text-white text-sm" href="#onboard">
            Create My Startup Plan
          </a>
        </div>

        <div id="onboard" className="card p-8">
          {!isSignedIn && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h2 className="section-title">Create your account</h2>
                <p className="text-sm text-black/60 mt-2">
                  This is the moment you become a founder. Sign up to start building.
                </p>
                <div className="mt-6 flex gap-2">
                  <button
                    className={`px-4 py-2 rounded-full text-sm ${tab === "signup" ? "bg-ink text-white" : "border border-black/10"}`}
                    onClick={() => setTab("signup")}
                  >
                    Sign up
                  </button>
                  <button
                    className={`px-4 py-2 rounded-full text-sm ${tab === "login" ? "bg-ink text-white" : "border border-black/10"}`}
                    onClick={() => setTab("login")}
                  >
                    Log in
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <input
                  className="w-full rounded-2xl border border-black/10 px-4 py-2"
                  placeholder="Email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                <input
                  className="w-full rounded-2xl border border-black/10 px-4 py-2"
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                {authError && <p className="text-sm text-red-500">{authError}</p>}
                <button className="w-full rounded-full bg-ink text-white py-2" onClick={handleEmailAuth}>
                  {tab === "signup" ? "Create account" : "Log in"}
                </button>
              </div>
            </div>
          )}

          {isSignedIn && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="section-title">Startup onboarding</h2>
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
              {projectId && (
                <a className="text-xs text-black/60 underline" href="/dashboard">
                  Plan ready. Go to dashboard.
                </a>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
