"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";

const heroStats = [
  { label: "Ideas rated", value: "8,400+" },
  { label: "Plans generated", value: "1,200+" },
  { label: "Competitions matched", value: "3,900+" }
];

const scorecards = [
  { label: "Market Fit", value: 82 },
  { label: "Feasibility", value: 79 },
  { label: "Execution Readiness", value: 86 },
  { label: "Competition Advantage", value: 74 }
];

const topMatchCards = [
  { name: "Conrad Challenge", score: 94, detail: "Strong fit for prototype-stage innovation with clear social impact." },
  { name: "Diamond Challenge", score: 91, detail: "High match for student entrepreneurship teams with plan + pitch focus." },
  { name: "Congressional App Challenge", score: 89, detail: "Ideal if you have a functional MVP and a civic-use angle." }
];

const outcomeCards = [
  {
    title: "BUILD A REAL PRODUCT",
    body: "Launch with modern tools and a concrete MVP plan in weeks, not semesters."
  },
  {
    title: "COMPETITION-READY PLAN",
    body: "Generate pitch materials and submission strategy matched to your current stage."
  },
  {
    title: "STARTUP-LEVEL EXECUTION",
    body: "Track progress, unlock milestones, and run your project like a founder."
  }
];

const detailSections = [
  {
    tag: "Roadmap Engine",
    title: "Detailed weekly roadmap with exact tools, steps, and outcomes",
    body:
      "Every stage includes action-by-action guidance, build stack recommendations, and clear deliverables so you always know what to do next.",
    bullets: [
      "Stage unlock logic and milestone flow",
      "Task-level execution guidance",
      "Inline resources, videos, and courses",
      "Progress-linked roadmap regeneration"
    ]
  },
  {
    tag: "Opportunity Match",
    title: "AI-ranked competitions and conferences with fit reasoning",
    body:
      "LaunchLab scores each competition based on your domain, stage, and readiness so you stop guessing where to apply.",
    bullets: [
      "Hundreds of opportunities",
      "Best-match reasoning by AI",
      "Filters for location, stage, and requirements",
      "Submission strategy guidance"
    ]
  },
  {
    tag: "Founder Scorecards",
    title: "Detailed idea rating with reasons and improvement actions",
    body:
      "You get a metric-by-metric breakdown for scope, complexity, market fit, feasibility, and competition density.",
    bullets: [
      "0-100 rating by core startup metrics",
      "Per-metric reasoning and weaknesses",
      "Recommended next actions to improve score",
      "Version-to-version trend tracking"
    ]
  },
  {
    tag: "Mentor Layer",
    title: "Founder-level AI guidance that updates as you execute",
    body:
      "Ask tactical questions, identify pitfalls, and adapt your weekly sprint based on the progress you actually logged.",
    bullets: [
      "Next-step recommendations",
      "Risk and pitfall identification",
      "Pitch and story refinement",
      "AI mentor available with paid subscription"
    ]
  }
];

const storyFrames = [
  {
    tag: "Step 1",
    title: "Clarify your founder direction",
    body: "Capture your idea stage, goals, and constraints so your plan starts from real context.",
    visualTitle: "Onboarding signal map",
    visualBody: "Idea stage + goal + timeline create your startup baseline.",
    metric: "5-minute intake"
  },
  {
    tag: "Step 2",
    title: "Generate your execution roadmap",
    body: "Get stage-by-stage tasks with exact tools, outputs, and resources.",
    visualTitle: "Roadmap generation",
    visualBody: "Every task is mapped to proof and momentum.",
    metric: "10-week structure"
  },
  {
    tag: "Step 3",
    title: "Run weekly progress loops",
    body: "Track completed work, confidence, and blockers to keep execution moving.",
    visualTitle: "Progress feedback loop",
    visualBody: "Done work updates next steps and unlock logic.",
    metric: "Weekly adaptation"
  },
  {
    tag: "Step 4",
    title: "Deploy to real opportunities",
    body: "Use AI fit scoring to prioritize competitions and conferences worth your time.",
    visualTitle: "Best-match intelligence",
    visualBody: "Filters + score reasoning produce a focused submission queue.",
    metric: "Hundreds ranked"
  }
];

const roadmapTasks = [
  {
    title: "Build landing page + pricing",
    tools: "Lovable · Framer · Webflow",
    detail: "Ship a premium landing page with clear value, pricing, proof, and conversion tracking.",
    steps: [
      "Write one-line value promise + three outcomes",
      "Build hero, proof stack, and pricing tiers",
      "Add waitlist flow and conversion analytics",
      "Measure source-level conversion performance"
    ]
  },
  {
    title: "Set up backend + auth",
    tools: "Supabase · Postgres · Auth",
    detail: "Create production-ready data architecture for onboarding, roadmap, scoring, and progress logs.",
    steps: [
      "Define users, projects, roadmap, and progress schemas",
      "Enable email auth and session handling",
      "Store onboarding answers and plan versions",
      "Connect dashboard reads/writes to live DB"
    ]
  },
  {
    title: "Run traction sprint",
    tools: "Reddit · Analytics · Notion",
    detail: "Drive targeted traffic, collect proof, and quantify traction signals.",
    steps: [
      "Publish tracked posts in high-intent communities",
      "Capture CTR, signups, and reply quality",
      "Interview five interested users",
      "Update roadmap and scorecards from evidence"
    ]
  },
  {
    title: "Prepare competition submission",
    tools: "Canva · Pitch · Notion",
    detail: "Create deck, one-pager, and demo narrative for top-fit competitions.",
    steps: [
      "Build 8-slide problem-to-traction story",
      "Write one-page executive summary",
      "Record 60-second product walkthrough",
      "Submit and track next deadlines"
    ]
  }
];

const testimonials = [
  {
    quote:
      "I moved from random ideas to a full roadmap, MVP plan, and competition submissions in under a month.",
    name: "Aarav P.",
    role: "High School Founder · EdTech"
  },
  {
    quote:
      "The match engine showed exactly where to apply and why. It removed guesswork and saved weeks.",
    name: "Maya R.",
    role: "Student Builder · HealthTech"
  },
  {
    quote:
      "The detailed idea rating showed what was weak, and the roadmap told me exactly how to improve it.",
    name: "Noah L.",
    role: "Startup Club Lead · AI Tools"
  }
];

const logoRail = [
  "Y Combinator",
  "MIT Launch",
  "Z Fellows",
  "FBLA",
  "DECA",
  "ISEF",
  "Conrad",
  "OpenAI",
  "Supabase",
  "Vercel",
  "GitHub",
  "Google Cloud"
];

const mentorModules = [
  {
    title: "Weekly Strategy Check-in",
    summary: "Get tactical weekly priorities based on your current roadmap status and evidence.",
    prompt: "What should I ship this week to improve score and traction?",
    output:
      "Prioritize one user segment test, ship one measurable milestone, and collect proof from 5 real users."
  },
  {
    title: "Pitch & Story Refinement",
    summary: "Turn your work into a competition-ready narrative with clear problem-solution proof.",
    prompt: "How do I improve my pitch storyline for judges?",
    output:
      "Lead with urgency signal, show traction, then explain why your execution path is uniquely credible."
  },
  {
    title: "Risk & Pitfall Detection",
    summary: "Surface hidden weaknesses in scope, distribution, or differentiation before they slow you down.",
    prompt: "What are my biggest execution risks right now?",
    output:
      "Your main risk is distribution ambiguity. Run tracked acquisition experiments before expanding features."
  },
  {
    title: "Competition Readiness Coach",
    summary: "Get tailored advice on where to apply and what artifacts to prepare for each opportunity.",
    prompt: "What do I need before submitting to Conrad and Diamond?",
    output:
      "Finalize a 60-second demo, one-page summary, and traction snapshot with one measurable user outcome."
  }
];

export default function Home() {
  const [activeDetail, setActiveDetail] = useState(0);
  const [activeTask, setActiveTask] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activeMatch, setActiveMatch] = useState(0);
  const [activeStory, setActiveStory] = useState(0);
  const [activeMentor, setActiveMentor] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const storyRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const detailTimer = setInterval(() => {
      setActiveDetail((prev) => (prev + 1) % detailSections.length);
    }, 5200);
    const taskTimer = setInterval(() => {
      setActiveTask((prev) => (prev + 1) % roadmapTasks.length);
    }, 4200);
    const testimonialTimer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 4700);
    const matchTimer = setInterval(() => {
      setActiveMatch((prev) => (prev + 1) % topMatchCards.length);
    }, 3900);
    const mentorTimer = setInterval(() => {
      setActiveMentor((prev) => (prev + 1) % mentorModules.length);
    }, 4800);

    return () => {
      clearInterval(detailTimer);
      clearInterval(taskTimer);
      clearInterval(testimonialTimer);
      clearInterval(matchTimer);
      clearInterval(mentorTimer);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const idx = Number(entry.target.getAttribute("data-story"));
          if (!Number.isNaN(idx)) setActiveStory(idx);
        });
      },
      { threshold: 0.58 }
    );
    storyRefs.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const activeSection = detailSections[activeDetail];
  const activeRoadmapTask = roadmapTasks[activeTask];
  const activeMatchCard = topMatchCards[activeMatch];
  const activeMentorModule = mentorModules[activeMentor];

  const comparisonRail = useMemo(
    () =>
      [
        "Manual path: 6 months of guesswork",
        "LaunchLab: 10-week execution system",
        "No matches → AI best-match engine",
        "Static plan → adaptive roadmap",
        "Isolated effort → mentor-guided execution",
        "Pitch-ready in weeks, not months"
      ].concat([
        "Manual path: 6 months of guesswork",
        "LaunchLab: 10-week execution system",
        "No matches → AI best-match engine",
        "Static plan → adaptive roadmap",
        "Isolated effort → mentor-guided execution",
        "Pitch-ready in weeks, not months"
      ]),
    []
  );

  return (
    <main className="premium-page">
      <div className="premium-bg premium-bg-one" style={{ transform: `translateY(${scrollY * 0.08}px)` }} />
      <div className="premium-bg premium-bg-two" style={{ transform: `translateY(${scrollY * -0.05}px)` }} />

      <div className="premium-wrap">
        <nav className="premium-nav">
          <a className="premium-brand" href="/">
            <span className="premium-brand-mark">L</span>
            <span>LaunchLab</span>
          </a>
          <div className="premium-nav-links">
            <a href="#details">Details</a>
            <a href="#roadmap">Roadmap</a>
            <a href="#mentor">Mentor</a>
            <a href="#proof">Proof</a>
            <a href="/pricing">Pricing</a>
            <a href="/login">Log in</a>
            <a className="premium-nav-cta" href="/signup">
              Start Building
            </a>
          </div>
        </nav>

        <section className="premium-hero premium-hero-full">
          <div className="premium-hero-copy">
            <p className="premium-eyebrow">Founder OS for Ambitious Students</p>
            <h1>Turn your idea into a real startup with a premium execution stack.</h1>
            <p>
              LaunchLab combines roadmap generation, competition intelligence, detailed startup rating, and progress-driven guidance into one founder workflow.
            </p>
            <div className="premium-hero-cta">
              <a href="/signup" className="premium-btn-primary">
                Create My Startup Plan
              </a>
              <a href="/login" className="premium-btn-secondary">
                Log in
              </a>
            </div>
            <p className="premium-micro">Free to start · No experience required · Takes ~5 minutes</p>

            <div className="premium-stat-grid">
              {heroStats.map((item) => (
                <article key={item.label} className="premium-hero-stat">
                  <p>{item.label}</p>
                  <strong>{item.value}</strong>
                </article>
              ))}
            </div>
          </div>

          <div className="premium-hero-stack">
            <article className="premium-hero-panel">
              <div className="premium-panel-head">
                <p>Founder Scorecards</p>
                <span>Live</span>
              </div>
              {scorecards.map((card) => (
                <div key={card.label} className="premium-score-block">
                  <div className="premium-score-row">
                    <label>{card.label}</label>
                    <strong>{card.value}/100</strong>
                  </div>
                  <div className="premium-score-bar">
                    <span style={{ width: `${card.value}%` }} />
                  </div>
                </div>
              ))}
            </article>

            <article className="premium-hero-mini premium-hero-mini-roadmap">
              <p className="premium-eyebrow">Execution Pulse</p>
              <h3>{activeRoadmapTask.title}</h3>
              <p>{activeRoadmapTask.tools}</p>
            </article>

            <article className="premium-hero-mini premium-hero-mini-match">
              <p className="premium-eyebrow">Best Match</p>
              <h3>{activeMatchCard.name}</h3>
              <div className="premium-match-score">{activeMatchCard.score}%</div>
              <p>{activeMatchCard.detail}</p>
            </article>
          </div>

          <div className="premium-scroll-cue">
            <span>Scroll for full product detail</span>
            <div className="premium-scroll-line">
              <span />
            </div>
          </div>
        </section>

        <section className="premium-outcomes">
          {outcomeCards.map((card, index) => (
            <article
              key={card.title}
              className="premium-outcome-card premium-stagger-item"
              style={{ "--stagger-delay": `${index * 90}ms` } as CSSProperties}
            >
              <span>{index + 1}</span>
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </section>

        <section className="premium-storytelling">
          <div className="premium-story-track">
            {storyFrames.map((frame, index) => (
              <article
                key={frame.title}
                ref={(node) => {
                  storyRefs.current[index] = node;
                }}
                data-story={index}
                className={`premium-story-step ${activeStory === index ? "is-active" : ""}`}
              >
                <p className="premium-eyebrow">{frame.tag}</p>
                <h3>{frame.title}</h3>
                <p>{frame.body}</p>
              </article>
            ))}
          </div>

          <div className="premium-story-sticky">
            {storyFrames.map((frame, index) => (
              <article key={frame.title} className={`premium-story-visual ${activeStory === index ? "is-active" : ""}`}>
                <p className="premium-eyebrow">{frame.visualTitle}</p>
                <h4>{frame.metric}</h4>
                <p>{frame.visualBody}</p>
                <div className="premium-story-progress">
                  <span style={{ width: `${((index + 1) / storyFrames.length) * 100}%` }} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="premium-comparison-rail">
          <div className="premium-comparison-track">
            {comparisonRail.map((item, index) => (
              <article key={`${item}-${index}`} className="premium-comparison-chip">
                {item}
              </article>
            ))}
          </div>
        </section>

        <section id="details" className="premium-feature-atlas">
          <div className="premium-feature-tabs">
            {detailSections.map((section, index) => (
              <button
                key={section.tag}
                className={`premium-tab ${activeDetail === index ? "is-active" : ""}`}
                onClick={() => setActiveDetail(index)}
              >
                {section.tag}
              </button>
            ))}
          </div>
          <div className="premium-feature-panel">
            <p className="premium-eyebrow">{activeSection.tag}</p>
            <h2>{activeSection.title}</h2>
            <p>{activeSection.body}</p>
            <ul>
              {activeSection.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section id="roadmap" className="premium-roadmap-studio">
          <div className="premium-roadmap-list">
            <p className="premium-eyebrow">Interactive Roadmap Preview</p>
            <h2>Click a task and see exact execution steps</h2>
            {roadmapTasks.map((task, index) => (
              <button
                key={task.title}
                className={`premium-roadmap-chip ${activeTask === index ? "is-active" : ""}`}
                onClick={() => setActiveTask(index)}
              >
                <div>
                  <strong>{task.title}</strong>
                  <span>{task.tools}</span>
                </div>
                <small>Open</small>
              </button>
            ))}
          </div>

          <div className="premium-roadmap-detail">
            <p className="premium-eyebrow">How to execute</p>
            <h3>{activeRoadmapTask.title}</h3>
            <p>{activeRoadmapTask.detail}</p>
            <ol>
              {activeRoadmapTask.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        </section>

        <section id="mentor" className="premium-mentor-section">
          <div className="premium-mentor-panel">
            <p className="premium-eyebrow">AI Mentor</p>
            <h2>Dedicated mentor workspace for strategy, pitfalls, and execution support</h2>
            <p>
              The mentor layer analyzes your roadmap and progress logs, then gives tactical guidance for what to do next.
            </p>
            <div className="premium-mentor-tabs">
              {mentorModules.map((module, index) => (
                <button
                  key={module.title}
                  className={`premium-mentor-tab ${activeMentor === index ? "is-active" : ""}`}
                  onClick={() => setActiveMentor(index)}
                >
                  {module.title}
                </button>
              ))}
            </div>
          </div>

          <div className="premium-mentor-preview">
            <p className="premium-eyebrow">Live mentor thread</p>
            <h3>{activeMentorModule.title}</h3>
            <p className="premium-mentor-summary">{activeMentorModule.summary}</p>
            <div className="premium-mentor-chat user">
              <span>Founder Prompt</span>
              <p>{activeMentorModule.prompt}</p>
            </div>
            <div className="premium-mentor-chat ai">
              <span>Mentor Response</span>
              <p>{activeMentorModule.output}</p>
            </div>
            <a href="/signup" className="premium-btn-primary">
              Unlock Mentor Access
            </a>
          </div>
        </section>

        <section id="proof" className="premium-testimonials">
          <div className="premium-testimonial-main">
            <p className="premium-eyebrow">Founder Testimonials</p>
            <blockquote key={testimonials[activeTestimonial].name}>
              “{testimonials[activeTestimonial].quote}”
            </blockquote>
            <div className="premium-testimonial-meta">
              <strong>{testimonials[activeTestimonial].name}</strong>
              <span>{testimonials[activeTestimonial].role}</span>
            </div>
          </div>
          <div className="premium-testimonial-dots">
            {testimonials.map((item, index) => (
              <button
                key={item.name}
                className={activeTestimonial === index ? "is-active" : ""}
                onClick={() => setActiveTestimonial(index)}
                aria-label={`Show testimonial ${index + 1}`}
              />
            ))}
          </div>
        </section>

        <section className="premium-logo-rail">
          <div className="premium-logo-track">
            {logoRail.concat(logoRail).map((item, index) => (
              <span key={`${item}-${index}`}>{item}</span>
            ))}
          </div>
        </section>

        <section className="premium-final-cta">
          <p className="premium-eyebrow">Start Now</p>
          <h2>This is where your founder journey becomes real.</h2>
          <p>
            Sign up, complete onboarding, generate your startup roadmap, and execute with momentum.
          </p>
          <div className="premium-hero-cta">
            <a href="/signup" className="premium-btn-primary">
              Create My Startup Plan
            </a>
            <a href="/login" className="premium-btn-secondary">
              I Already Have an Account
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
