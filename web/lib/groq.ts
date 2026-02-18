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

function fallbackPlan(payload: any) {
  const roadmap = fallbackRoadmap(payload);
  const domain = payload?.project?.domain || payload?.domain || "your selected domain";
  const stage = payload?.project?.stage || payload?.stage || "early validation";
  const goal = payload?.project?.goal || payload?.onboarding?.primaryGoal || "build a real product";
  return {
    idea_rating: {
      scope: 72,
      complexity: 63,
      market_fit: 70,
      competition_density: 55,
      feasibility: 74
    },
    idea_rating_details: {
      scope: {
        reason: `You have a concrete founder direction in ${domain}, but the first version should stay narrower.`,
        improve_with: "Pick one user segment and one core outcome for the next 2 weeks."
      },
      complexity: {
        reason: "The technical path is feasible, but execution risk increases if you build too many features at once.",
        improve_with: "Prioritize one end-to-end flow before adding optional features."
      },
      market_fit: {
        reason: `Problem-solution fit looks promising for ${stage}, but validation evidence is still limited.`,
        improve_with: "Run user interviews and capture decision-making quotes and objections."
      },
      competition_density: {
        reason: "This space has many competitors, so proof and differentiation matter more than ideas.",
        improve_with: "Define a measurable wedge and ship a traction milestone quickly."
      },
      feasibility: {
        reason: `Given your current goal (${goal}), the roadmap is realistic if you execute weekly.`,
        improve_with: "Set weekly deliverables and log progress publicly to maintain momentum."
      }
    },
    idea_aspect_feedback: [
      {
        aspect: "Problem Clarity",
        score: 78,
        strength: "The problem statement is understandable and tied to a real student pain point.",
        risk: "Problem statement still spans multiple user types which can blur execution focus.",
        next_action: "Choose one exact user segment and one measurable pain indicator for the next sprint."
      },
      {
        aspect: "User Urgency",
        score: 69,
        strength: "Users likely relate to the problem and can describe current frustrations.",
        risk: "Urgency may be moderate unless you validate behavior-level willingness to switch.",
        next_action: "Run 8 interview calls and capture urgency signals with exact quotes."
      },
      {
        aspect: "Differentiation",
        score: 64,
        strength: "There is room to position this as a founder-first execution workflow.",
        risk: "Competitor overlap is high without a clear wedge and proof artifact strategy.",
        next_action: "Define a one-sentence wedge and add one unique proof mechanism in week 1."
      },
      {
        aspect: "Distribution",
        score: 62,
        strength: "You can access early users through school communities and founder channels.",
        risk: "Distribution is unproven until consistent traffic and signup conversions are tracked.",
        next_action: "Ship tracked acquisition experiments in Reddit and student communities this week."
      },
      {
        aspect: "Monetization Potential",
        score: 66,
        strength: "A free-to-paid upgrade path is plausible with mentor and advanced features.",
        risk: "Willingness to pay is unknown for early-stage student users.",
        next_action: "Test pricing hypotheses with waitlist users before adding premium complexity."
      },
      {
        aspect: "Technical Execution Risk",
        score: 71,
        strength: "Current tools make MVP development feasible within short timelines.",
        risk: "Execution risk rises quickly if scope expands beyond a single core workflow.",
        next_action: "Limit sprint scope to one complete value flow with instrumentation."
      },
      {
        aspect: "Competition Readiness",
        score: 74,
        strength: "Roadmap structure aligns with requirements for major student competitions.",
        risk: "Submission quality depends on proof, not just plan quality.",
        next_action: "Prepare demo + traction artifacts before finalizing pitch deck narrative."
      },
      {
        aspect: "Founder Advantage",
        score: 73,
        strength: "Founder motivation and execution cadence can become a major edge.",
        risk: "Momentum may drop without a strict weekly accountability loop.",
        next_action: "Log weekly progress publicly and tie each week to one visible deliverable."
      }
    ],
    idea_feedback:
      "Strong execution potential if you validate demand quickly and keep the first version narrow. Focus on one measurable user outcome.",
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
