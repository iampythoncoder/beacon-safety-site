import Groq from "groq-sdk";

const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const DEFAULT_TOOLS = ["Lovable", "Bolt", "Webflow", "Supabase", "Notion", "Claude CLI", "Codex"];

function hasGroqKey() {
  return Boolean(process.env.GROQ_API_KEY);
}

function fallbackRoadmap(input: any) {
  const domain = input?.project?.domain || input?.domain || "student startup";
  return [
    {
      stage_id: "stage-1",
      stage_name: "Problem Validation",
      weeks: [
        {
          week: 1,
          tasks: [
            { task_id: "s1-w1-t1", task: "Interview 10 target users and capture pain points." },
            { task_id: "s1-w1-t2", task: "Write a one-line problem statement with target segment." },
            { task_id: "s1-w1-t3", task: "Rank top 3 pains by urgency and current workaround." },
            { task_id: "s1-w1-t4", task: "Convert interviews into evidence-backed assumptions." }
          ],
          tools: ["Notion", "Google Forms"],
          deliverables: ["Interview notes", "Prioritized pain list", "Problem statement doc"],
          tips: "Use exact quotes from users, not assumptions.",
          pitfalls: ["Leading questions", "Interviewing only friends"]
        }
      ]
    },
    {
      stage_id: "stage-2",
      stage_name: "Positioning + Offer Clarity",
      weeks: [
        {
          week: 2,
          tasks: [
            { task_id: "s2-w2-t1", task: "Define your wedge: why this is different from alternatives." },
            { task_id: "s2-w2-t2", task: "Draft a value proposition and three benefit bullets." },
            { task_id: "s2-w2-t3", task: "Write pricing hypothesis for free, starter, and pro tiers." }
          ],
          tools: ["Notion", "Canva", "Google Docs"],
          deliverables: ["Positioning sheet", "Offer stack", "Draft pricing table"],
          tips: "Keep language specific to your user segment.",
          pitfalls: ["Vague positioning", "No measurable value promise"]
        }
      ]
    },
    {
      stage_id: "stage-3",
      stage_name: "Landing Page + Waitlist",
      weeks: [
        {
          week: 3,
          tasks: [
            { task_id: "s3-w3-t1", task: "Generate website with landing page + pricing using Lovable or Bolt." },
            { task_id: "s3-w3-t2", task: "Set up waitlist capture with UTM source tracking." },
            { task_id: "s3-w3-t3", task: "Publish social proof blocks and founder story section." },
            { task_id: "s3-w3-t4", task: "Track conversion baseline from visitor to signup." }
          ],
          tools: ["Lovable", "Bolt", "Framer", "Google Analytics"],
          deliverables: ["Live landing page", "Pricing section", "First conversion report"],
          tips: "Prioritize one CTA and one conversion path.",
          pitfalls: ["No tracking setup", "Crowded landing copy"]
        }
      ]
    },
    {
      stage_id: "stage-4",
      stage_name: "MVP Build Sprint",
      weeks: [
        {
          week: 4,
          tasks: [
            { task_id: "s4-w4-t1", task: `Build MVP core flow for ${domain} use case in one week.` },
            { task_id: "s4-w4-t2", task: "Set up auth and core backend tables in Supabase." },
            { task_id: "s4-w4-t3", task: "Connect frontend state with real user data." },
            { task_id: "s4-w4-t4", task: "Run 5 usability tests and fix top blockers." }
          ],
          tools: ["Lovable", "Bolt", "Supabase", "Vercel"],
          deliverables: ["Working MVP", "Supabase schema", "Usability test notes"],
          tips: "Ship one complete flow before adding secondary features.",
          pitfalls: ["Feature creep", "Skipping instrumentation"]
        }
      ]
    },
    {
      stage_id: "stage-5",
      stage_name: "Distribution + Traction",
      weeks: [
        {
          week: 5,
          tasks: [
            { task_id: "s5-w5-t1", task: "Create launch posts and advertise on Reddit with tracked domain links." },
            { task_id: "s5-w5-t2", task: "Launch in two student communities and capture reply themes." },
            { task_id: "s5-w5-t3", task: "Set up activation metric and weekly retention sheet." }
          ],
          tools: ["Reddit", "Google Sheets", "Plausible"],
          deliverables: ["Traffic report", "Acquisition log", "Activation baseline"],
          tips: "Use one tracked link per channel so attribution is clear.",
          pitfalls: ["Untracked traffic", "No follow-up with interested users"]
        }
      ]
    },
    {
      stage_id: "stage-6",
      stage_name: "Competition + Pitch Readiness",
      weeks: [
        {
          week: 6,
          tasks: [
            { task_id: "s6-w6-t1", task: "Generate 8-slide pitch deck and 1-page executive summary." },
            { task_id: "s6-w6-t2", task: "Record a 60-second demo walkthrough." },
            { task_id: "s6-w6-t3", task: "Submit to top 3 best-fit competitions." },
            { task_id: "s6-w6-t4", task: "Build FAQ sheet for judges and mentors." }
          ],
          tools: ["Canva", "Pitch", "Notion"],
          deliverables: ["Pitch deck", "Demo video", "3 submissions", "Judge FAQ sheet"],
          tips: "Lead with problem proof and traction signal.",
          pitfalls: ["Generic storytelling", "No measurable outcomes"]
        }
      ]
    },
    {
      stage_id: "stage-7",
      stage_name: "Mentor + Investor Prep",
      weeks: [
        {
          week: 7,
          tasks: [
            { task_id: "s7-w7-t1", task: "Prepare outreach list of 20 mentors, student VCs, and operators." },
            { task_id: "s7-w7-t2", task: "Send concise founder updates with metrics and asks." },
            { task_id: "s7-w7-t3", task: "Iterate deck and product based on feedback loops." }
          ],
          tools: ["Notion", "Gmail", "HubSpot"],
          deliverables: ["Outreach CRM", "Weekly investor update", "Revised deck"],
          tips: "End every update with a specific ask.",
          pitfalls: ["Generic outreach", "No traction numbers"]
        }
      ]
    },
    {
      stage_id: "stage-8",
      stage_name: "Proof Stack + Next Milestone",
      weeks: [
        {
          week: 8,
          tasks: [
            { task_id: "s8-w8-t1", task: "Compile proof stack for college apps and accelerator submissions." },
            { task_id: "s8-w8-t2", task: "Define next 30-day milestone with numeric target." },
            { task_id: "s8-w8-t3", task: "Set recurring weekly review to adjust roadmap based on progress." }
          ],
          tools: ["Notion", "Google Drive", "LaunchLab"],
          deliverables: ["Proof stack folder", "30-day milestone plan", "Weekly review cadence"],
          tips: "Use tangible artifacts: screenshots, metrics, and testimonials.",
          pitfalls: ["No milestone owner", "No numeric target"]
        }
      ]
    }
  ];
}

type IdeaMetric = "scope" | "complexity" | "market_fit" | "competition_density" | "feasibility";
type IdeaRating = Record<IdeaMetric, number>;

function clampMetric(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function seededOffset(seed: string, key: string, spread = 3) {
  const source = `${seed}:${key}`;
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash << 5) - hash + source.charCodeAt(i);
    hash |= 0;
  }
  const range = spread * 2 + 1;
  return (Math.abs(hash) % range) - spread;
}

function describeBand(score: number) {
  if (score >= 75) return "strong";
  if (score >= 60) return "promising";
  return "early";
}

function metricLabel(metric: IdeaMetric) {
  if (metric === "market_fit") return "market fit";
  if (metric === "competition_density") return "competitive edge";
  return metric;
}

function estimateFallbackIdeaRating(payload: any): IdeaRating {
  const project = payload?.project || payload || {};
  const onboarding = payload?.onboarding || {};
  const domain = String(project.domain || onboarding.domains?.[0] || "").trim();
  const stage = String(project.stage || onboarding.ideaStage || "").toLowerCase();
  const goal = String(project.goal || onboarding.primaryGoal || "").trim();
  const ideaText = String(onboarding.ideaSentence || project.project_description || "").trim();
  const timelineWeeks = Number(project.timeline_available_weeks || 0);
  const teamSize = Number(project.team_size || 1);
  const demoBuilt = Boolean(project.demo_built);
  const domainsCount = Array.isArray(onboarding.domains)
    ? onboarding.domains.filter(Boolean).length
    : domain
      ? 1
      : 0;
  const goalWords = goal ? goal.split(/\s+/).filter(Boolean).length : 0;
  const ideaWords = ideaText ? ideaText.split(/\s+/).filter(Boolean).length : 0;
  const seed = [domain, stage, goal, ideaText, String(teamSize), String(timelineWeeks), demoBuilt ? "1" : "0"].join("|");

  const stageExecutionBoost =
    stage.includes("launch") || stage.includes("growth")
      ? 10
      : stage.includes("mvp") || stage.includes("beta")
        ? 7
        : stage.includes("prototype")
          ? 4
          : stage.includes("research")
            ? 2
            : 0;
  const timelineBoost = timelineWeeks >= 12 ? 11 : timelineWeeks >= 8 ? 8 : timelineWeeks >= 5 ? 5 : timelineWeeks > 0 ? 2 : 0;
  const teamBoost = teamSize >= 3 ? 9 : teamSize === 2 ? 6 : 2;

  return {
    scope: clampMetric(
      62 +
        (goalWords > 0 && goalWords <= 12 ? 10 : goalWords <= 18 ? 6 : 3) +
        (domainsCount <= 1 ? 8 : domainsCount === 2 ? 5 : 1) +
        (ideaWords >= 20 ? 5 : ideaWords >= 10 ? 2 : 0) +
        seededOffset(seed, "scope"),
      50,
      95
    ),
    complexity: clampMetric(
      58 +
        stageExecutionBoost +
        timelineBoost +
        teamBoost +
        (demoBuilt ? 6 : 0) -
        (domainsCount > 2 ? 3 : 0) +
        seededOffset(seed, "complexity"),
      48,
      93
    ),
    market_fit: clampMetric(
      57 +
        (ideaWords >= 24 ? 8 : ideaWords >= 12 ? 5 : 1) +
        (goal ? 7 : 0) +
        (stage.includes("launch") || stage.includes("mvp") ? 8 : stage.includes("prototype") ? 4 : 0) +
        (demoBuilt ? 6 : 0) +
        seededOffset(seed, "market_fit"),
      48,
      95
    ),
    competition_density: clampMetric(
      55 +
        (domainsCount === 1 ? 8 : domainsCount === 2 ? 6 : 3) +
        (goalWords <= 12 ? 7 : 4) +
        (demoBuilt ? 6 : 0) +
        (stage.includes("launch") ? 4 : 0) +
        seededOffset(seed, "competition_density"),
      46,
      92
    ),
    feasibility: clampMetric(
      57 + timelineBoost + teamBoost + stageExecutionBoost + (demoBuilt ? 8 : 0) + seededOffset(seed, "feasibility"),
      46,
      96
    )
  };
}

function buildFallbackRatingDetails(rating: IdeaRating, payload: any) {
  const project = payload?.project || payload || {};
  const onboarding = payload?.onboarding || {};
  const domain = String(project.domain || onboarding.domains?.[0] || "your focus domain");
  const stage = String(project.stage || onboarding.ideaStage || "current stage");
  const goal = String(project.goal || onboarding.primaryGoal || "current founder goal");

  const makeDetail = (metric: IdeaMetric) => {
    const score = rating[metric];
    const band = describeBand(score);

    if (metric === "scope") {
      return {
        reason:
          band === "strong"
            ? `Scope is focused enough in ${domain} to execute quickly without major drift.`
            : band === "promising"
              ? `Scope direction is clear, but a tighter first wedge would improve execution speed in ${domain}.`
              : "Scope is still broad and will likely slow the first usable release.",
        improve_with: "Choose one core user segment and one measurable outcome for the next two weeks."
      };
    }

    if (metric === "complexity") {
      return {
        reason:
          band === "strong"
            ? `The build path at ${stage} is realistic with current constraints.`
            : band === "promising"
              ? `Complexity is manageable if the first release stays narrow and milestone-driven.`
              : "Execution complexity is high for the current stage and needs simplification.",
        improve_with: "Reduce MVP to one end-to-end workflow and defer non-core features."
      };
    }

    if (metric === "market_fit") {
      return {
        reason:
          band === "strong"
            ? "Problem-solution alignment looks strong and ready for traction testing."
            : band === "promising"
              ? "Market fit signals exist, but demand evidence is still early."
              : "Market fit is not validated enough yet to scale build scope.",
        improve_with: "Run 8 to 10 user calls and capture direct willingness-to-use signals."
      };
    }

    if (metric === "competition_density") {
      return {
        reason:
          band === "strong"
            ? "Your positioning has enough edge to stand out against common alternatives."
            : band === "promising"
              ? "Differentiation is forming, but proof points need to be more explicit."
              : "Competitive pressure is high unless your wedge is clearer and evidence-backed.",
        improve_with: "Write a one-sentence wedge and prove it weekly with visible product milestones."
      };
    }

    return {
      reason:
        band === "strong"
          ? `Current constraints support feasible execution toward ${goal}.`
          : band === "promising"
            ? `Execution toward ${goal} is feasible with tighter weekly planning.`
            : "Feasibility is low until scope and sequencing are simplified.",
      improve_with: "Set weekly deliverables with owners and track completion each sprint."
    };
  };

  return {
    scope: makeDetail("scope"),
    complexity: makeDetail("complexity"),
    market_fit: makeDetail("market_fit"),
    competition_density: makeDetail("competition_density"),
    feasibility: makeDetail("feasibility")
  };
}

function buildFallbackAspectFeedback(rating: IdeaRating, details: Record<IdeaMetric, { reason: string; improve_with: string }>, seed: string) {
  const templates = [
    { aspect: "Problem Clarity", metric: "scope" as const, delta: 4 },
    { aspect: "User Urgency", metric: "market_fit" as const, delta: 1 },
    { aspect: "Differentiation", metric: "competition_density" as const, delta: 3 },
    { aspect: "Distribution", metric: "market_fit" as const, delta: -2 },
    { aspect: "Monetization Potential", metric: "feasibility" as const, delta: 0 },
    { aspect: "Technical Execution Risk", metric: "complexity" as const, delta: -1 },
    { aspect: "Competition Readiness", metric: "competition_density" as const, delta: 2 },
    { aspect: "Founder Advantage", metric: "feasibility" as const, delta: 2 }
  ];

  return templates.map((item, index) => {
    const score = clampMetric(rating[item.metric] + item.delta + seededOffset(seed, `${item.metric}-${index}`, 4), 45, 96);
    const band = describeBand(score);
    return {
      aspect: item.aspect,
      score,
      strength: details[item.metric].reason,
      risk:
        band === "strong"
          ? "Main risk is momentum decay if weekly shipping discipline drops."
          : band === "promising"
            ? "Risk is moderate until this area has stronger evidence from users."
            : "Risk is high right now and should be prioritized before expanding scope.",
      next_action: details[item.metric].improve_with
    };
  });
}

function buildFallbackIdeaFeedback(rating: IdeaRating) {
  const pairs = (Object.entries(rating) as Array<[IdeaMetric, number]>).sort((a, b) => a[1] - b[1]);
  const weakest = pairs.slice(0, 2).map(([key]) => metricLabel(key));
  const avg = Math.round((pairs.reduce((sum, [, value]) => sum + value, 0) / pairs.length) * 10) / 10;

  if (avg >= 74) {
    return `Strong baseline (${avg}/100). Keep execution tight and focus on improving ${weakest.join(" and ")} with weekly evidence.`;
  }
  if (avg >= 58) {
    return `Promising baseline (${avg}/100). Prioritize ${weakest.join(" and ")} before expanding roadmap scope.`;
  }
  return `Early-stage baseline (${avg}/100). Narrow scope and validate ${weakest.join(" and ")} before adding complexity.`;
}

function fallbackPlan(payload: any) {
  const roadmap = fallbackRoadmap(payload);
  const domain = payload?.project?.domain || payload?.domain || "your selected domain";
  const stage = payload?.project?.stage || payload?.stage || "early validation";
  const goal = payload?.project?.goal || payload?.onboarding?.primaryGoal || "build a real product";
  const rating = estimateFallbackIdeaRating(payload);
  const details = buildFallbackRatingDetails(rating, payload);
  const ratingSeed = [domain, stage, goal].join("|");
  return {
    idea_rating: rating,
    idea_rating_details: details,
    idea_aspect_feedback: buildFallbackAspectFeedback(rating, details, ratingSeed),
    idea_feedback: buildFallbackIdeaFeedback(rating),
    business_plan: {
      problem: "Students with strong ideas lack a clear startup execution path.",
      solution: "A founder OS that gives stage-based steps, tools, and opportunity matching.",
      target_user: "Ambitious high school founders",
      key_features: ["Roadmap", "Competition matching", "Progress tracking", "Mentor insights"],
      monetization: "Free core plan + paid mentor tier",
      success_metrics: ["Weekly task completion", "Waitlist signups", "Competition submissions"]
    },
    mentor_summary: {
      summary: "Prioritize validation before adding features.",
      next_steps: ["Interview users", "Ship landing page", "Track conversion"],
      pitfalls: ["Building too much too early", "No success metric"],
      faq: [{ question: "What first?", answer: "Validate problem and demand this week." }]
    },
    roadmap
  };
}

function parseOrFallback(content: string, fallback: any) {
  try {
    return JSON.parse(content);
  } catch {
    return fallback;
  }
}

export function createGroqClient() {
  const apiKey = process.env.GROQ_API_KEY || "";
  if (!apiKey) {
    console.warn("GROQ_API_KEY missing");
  }
  return new Groq({ apiKey });
}

export async function generatePlan(groq: Groq, payload: any) {
  if (!hasGroqKey()) {
    return fallbackPlan(payload);
  }

  const system = "You are a startup mentor for high school founders. Return strict JSON only.";
  const user = {
    task: "Generate an idea rating, a lean business plan, a detailed roadmap, mentor summary, and next steps.",
    constraints: {
      stages: 10,
      tasks_per_week: "3-7",
      tools: ["Bolt", "Lovable", "Webflow", "Firebase", "Notion", "Codex", "Claude CLI"],
      examples: [
        "Generate website with landing page + pricing using Webflow",
        "Set up database using Firebase",
        "Advertise on Reddit using a tracked domain link"
      ]
    },
    output_contract: {
      idea_rating: "scope, complexity, market_fit, competition_density, feasibility (0-100)",
      idea_rating_details:
        "keys: scope, complexity, market_fit, competition_density, feasibility. each has reason + improve_with",
      idea_aspect_feedback:
        "array of 8+ aspects. each item: aspect, score (0-100), strength, risk, next_action",
      idea_feedback: "short paragraph on strengths + improvement areas",
      business_plan: "problem, solution, target user, key features, success metrics, monetization",
      roadmap: "10-12 stages, 3-7 tasks/week, include tools, deliverables, tips, pitfalls",
      mentor_summary: "summary, next_steps, pitfalls, faq"
    },
    input: payload
  };

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: JSON.stringify(user) }
    ],
    temperature: 0.3,
    response_format: { type: "json_object" }
  }).catch(() => null as any);

  const content = completion?.choices?.[0]?.message?.content || "";
  return parseOrFallback(content, fallbackPlan(payload));
}

export async function generateRoadmap(groq: Groq, payload: any) {
  if (!hasGroqKey()) {
    return { roadmap: fallbackRoadmap(payload) };
  }

  const system = "You are a startup execution coach. Return strict JSON only.";
  const user = {
    task: "Generate only roadmap JSON.",
    format: {
      roadmap: [
        {
          stage_id: "stage-1",
          stage_name: "Stage Name",
          weeks: [
            {
              week: 1,
              tasks: [{ task_id: "id", task: "Do thing" }],
              tools: DEFAULT_TOOLS,
              deliverables: ["Deliverable A"],
              tips: "Short tip",
              pitfalls: ["Pitfall A"]
            }
          ]
        }
      ]
    },
    constraints: {
      stages: "4-8",
      tasks_per_week: "3-6"
    },
    input: payload
  };

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: JSON.stringify(user) }
    ],
    temperature: 0.25,
    response_format: { type: "json_object" }
  }).catch(() => null as any);

  const content = completion?.choices?.[0]?.message?.content || "";
  return parseOrFallback(content, { roadmap: fallbackRoadmap(payload) });
}
