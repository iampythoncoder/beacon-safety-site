import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { ProjectInputSchema, ProgressUpdateSchema, ProjectInput, AIResponseSchema } from "./schemas.js";
import { createGroqClient, generateAnalysis, generateMatchExplanations } from "./ai.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const PORT = Number(process.env.PORT || 4000);
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("Supabase env vars missing: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}
if (!GROQ_API_KEY) {
  console.warn("Groq API key missing: GROQ_API_KEY");
}

// Supabase client for DB access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

// Groq client for AI generation
const groq = createGroqClient();

async function safeGenerateAnalysis(input: ProjectInput) {
  if (!GROQ_API_KEY) return fallbackAIResponse();
  try {
    return await generateAnalysis(groq, input);
  } catch (err) {
    console.warn("Groq response invalid, falling back.");
    return fallbackAIResponse();
  }
}

async function safeGenerateMatchNotes(payload: Parameters<typeof generateMatchExplanations>[1]) {
  if (!GROQ_API_KEY) return {};
  try {
    return await generateMatchExplanations(groq, payload);
  } catch (err) {
    console.warn("Groq match explanation failed, skipping.");
    return {};
  }
}

function relevanceScore(input: {
  domain?: string;
  stage?: string;
  demo_built?: boolean;
  requires_demo?: boolean | null;
  requires_plan?: boolean | null;
  team_size?: number;
  team_size_max?: number | null;
  age_min?: number | null;
  age_max?: number | null;
}) {
  let score = 0;
  if (input.domain) score += 20;
  if (input.stage) score += 20;
  if (input.demo_built && input.requires_demo) score += 20;
  if (!input.requires_plan) score += 10;
  if (input.team_size_max && input.team_size && input.team_size <= input.team_size_max) score += 20;
  if (input.age_min !== null || input.age_max !== null) score += 10;
  return Math.min(100, score);
}

function fallbackAIResponse(): AIResponseSchema._type {
  return {
    idea_rating: {
      scope: 0,
      complexity: 0,
      market_fit: 0,
      competition_density: 0,
      feasibility: 0,
      notes: "GROQ_API_KEY not set"
    },
    lean_business_plan: {
      problem_statement: "",
      solution_summary: "",
      target_user: "",
      key_features: [],
      success_metrics: [],
      monetization_strategy: ""
    },
    roadmap: [],
    mentor_notes: {
      summary: "",
      next_steps: [],
      pitfalls: [],
      faq: []
    },
    summary: ""
  };
}

async function fetchCompetitionMatches(input: ProjectInput) {
  let query = supabase.from("competitions").select("*");
  query = query.ilike("domain_focus", `%${input.domain}%`);
  query = query.ilike("stage_fit", `%${input.stage}%`);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((item) => ({
    ...item,
    relevance_score: relevanceScore({
      domain: input.domain,
      stage: input.stage,
      demo_built: input.demo_built,
      requires_demo: item.requires_demo,
      requires_plan: item.requires_plan,
      team_size: input.team_size,
      team_size_max: item.team_size_max,
      age_min: item.eligibility_age_min,
      age_max: item.eligibility_age_max
    })
  }));
}

async function fetchPitchMatches(input: ProjectInput) {
  let query = supabase.from("pitch_opportunities").select("*");
  query = query.ilike("relevance_tags", `%${input.domain}%`);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((item) => ({
    ...item,
    relevance_score: relevanceScore({
      domain: input.domain,
      stage: input.stage,
      demo_built: input.demo_built,
      requires_demo: item.requires_demo,
      requires_plan: item.requires_plan,
      team_size: input.team_size,
      team_size_max: item.team_size_max,
      age_min: item.eligibility_age_min,
      age_max: item.eligibility_age_max
    })
  }));
}

// Health check
app.get("/health", (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Create project: generate AI outputs + store in Supabase
app.post("/project", async (req, res) => {
  try {
    const parsed = ProjectInputSchema.parse(req.body);

    const analysis = await safeGenerateAnalysis(parsed);
    let competitionMatches = [];
    let pitchMatches = [];
    try {
      competitionMatches = await fetchCompetitionMatches(parsed);
    } catch (err) {
      console.warn("Competition match fetch failed, continuing:", err);
    }
    try {
      pitchMatches = await fetchPitchMatches(parsed);
    } catch (err) {
      console.warn("Pitch match fetch failed, continuing:", err);
    }

    const competitionExplanations = await safeGenerateMatchNotes({
      input: parsed,
      type: "competition",
      matches: competitionMatches.map((m) => ({
        id: m.id,
        name: m.name,
        stage_fit: m.stage_fit,
        domain_focus: m.domain_focus,
        requires_demo: m.requires_demo,
        requires_plan: m.requires_plan
      }))
    });

    const pitchExplanations = await safeGenerateMatchNotes({
      input: parsed,
      type: "pitch",
      matches: pitchMatches.map((m) => ({
        id: m.id,
        name: m.name,
        stage_fit: undefined,
        domain_focus: undefined,
        requires_demo: m.requires_demo,
        requires_plan: m.requires_plan
      }))
    });

    const competitionWithNotes = competitionMatches.map((match) => ({
      ...match,
      explanation: competitionExplanations[match.id] || "No AI explanation available."
    }));

    const pitchWithNotes = pitchMatches.map((match) => ({
      ...match,
      explanation: pitchExplanations[match.id] || "No AI explanation available."
    }));

    const insertPayload = {
      user_id: parsed.user_id || null,
      project_input: parsed,
      idea_rating: analysis.idea_rating,
      lean_business_plan: analysis.lean_business_plan,
      roadmap: analysis.roadmap,
      mentor_notes: analysis.mentor_notes,
      summary: analysis.summary,
      competition_matches: competitionWithNotes,
      pitch_matches: pitchWithNotes,
      progress: { stages: [] }
    };

    const { data, error } = await supabase
      .from("user_projects")
      .insert(insertPayload)
      .select("id")
      .single();

    if (error) throw error;

    res.json({ project_id: data.id, ...insertPayload });
  } catch (err: any) {
    console.error("Onboarding error:", err);
    res.status(400).json({ error: err.message || "Invalid request", stack: err?.stack || null });
  }
});

// Fetch full project record
app.get("/project/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("user_projects")
      .select("*")
      .eq("id", req.params.id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(404).json({ error: err.message || "Not found" });
  }
});

// Fetch latest project for a user
app.get("/project/user/:userId", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("user_projects")
      .select("*")
      .eq("user_id", req.params.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(404).json({ error: err.message || "Not found" });
  }
});

// Onboarding status check
app.get("/user/:id/onboarding-status", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("has_completed_onboarding")
      .eq("user_id", req.params.id)
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      const { error: upsertError } = await supabase
        .from("users")
        .upsert({ user_id: req.params.id, has_completed_onboarding: false });
      if (upsertError) throw upsertError;
      return res.json({ has_completed_onboarding: false });
    }
    res.json(data);
  } catch (err: any) {
    res.status(404).json({ error: err.message || "Not found" });
  }
});

// Onboarding submission: store profile, mark complete, generate plan
app.post("/onboarding", async (req, res) => {
  let stage = "start";
  try {
    stage = "parse";
    const parsed = ProjectInputSchema.parse(req.body);
    if (!parsed.user_id || !parsed.onboarding) {
      return res.status(400).json({ error: "Missing user_id or onboarding payload", stage: "validate" });
    }

    const userId = parsed.user_id;
    const onboarding = parsed.onboarding;

    stage = "users_upsert";
    const { error: upsertUserError } = await supabase
      .from("users")
      .upsert({ user_id: userId, has_completed_onboarding: false });
    if (upsertUserError) throw new Error(`users_upsert: ${upsertUserError.message}`);

    stage = "startup_profile_insert";
    const { error: profileError } = await supabase
      .from("startup_profile")
      .insert({
        user_id: userId,
        idea_stage: onboarding.ideaStage || "",
        domains: (onboarding.domains || []).join(", "),
        primary_goal: onboarding.primaryGoal || "",
        experience: onboarding.experience || "",
        timeline: onboarding.timeline || "",
        idea_sentence: onboarding.ideaSentence || ""
      });
    if (profileError) throw new Error(`startup_profile_insert: ${profileError.message}`);

    stage = "analysis";
    const analysis = await safeGenerateAnalysis(parsed);

    stage = "matches";
    let competitionMatches = [];
    let pitchMatches = [];
    try {
      competitionMatches = await fetchCompetitionMatches(parsed);
    } catch (err) {
      console.warn("Competition match fetch failed, continuing:", err);
    }
    try {
      pitchMatches = await fetchPitchMatches(parsed);
    } catch (err) {
      console.warn("Pitch match fetch failed, continuing:", err);
    }

    stage = "match_notes";
    const competitionExplanations = await safeGenerateMatchNotes({
      input: parsed,
      type: "competition",
      matches: competitionMatches.map((m) => ({
        id: m.id,
        name: m.name,
        stage_fit: m.stage_fit,
        domain_focus: m.domain_focus,
        requires_demo: m.requires_demo,
        requires_plan: m.requires_plan
      }))
    });

    const pitchExplanations = await safeGenerateMatchNotes({
      input: parsed,
      type: "pitch",
      matches: pitchMatches.map((m) => ({
        id: m.id,
        name: m.name,
        stage_fit: undefined,
        domain_focus: undefined,
        requires_demo: m.requires_demo,
        requires_plan: m.requires_plan
      }))
    });

    const competitionWithNotes = competitionMatches.map((match) => ({
      ...match,
      explanation: competitionExplanations[match.id] || "No AI explanation available."
    }));

    const pitchWithNotes = pitchMatches.map((match) => ({
      ...match,
      explanation: pitchExplanations[match.id] || "No AI explanation available."
    }));

    stage = "user_projects_insert";
    const insertPayload = {
      user_id: userId,
      project_input: parsed,
      idea_rating: analysis.idea_rating,
      lean_business_plan: analysis.lean_business_plan,
      roadmap: analysis.roadmap,
      mentor_notes: analysis.mentor_notes,
      summary: analysis.summary,
      competition_matches: competitionWithNotes,
      pitch_matches: pitchWithNotes,
      progress: { stages: [] }
    };

    const { data, error } = await supabase
      .from("user_projects")
      .insert(insertPayload)
      .select("id")
      .single();
    if (error) throw new Error(`user_projects_insert: ${error.message}`);

    stage = "users_update";
    const { error: updateUserError } = await supabase
      .from("users")
      .update({ has_completed_onboarding: true })
      .eq("user_id", userId);
    if (updateUserError) throw new Error(`users_update: ${updateUserError.message}`);

    res.json({ project_id: data.id, ...insertPayload });
  } catch (err: any) {
    console.error("Onboarding failure:", stage, err);
    res.status(400).json({ error: err.message || "Invalid request", stage, stack: err?.stack || null });
  }
});

// PDF-ready summary block for export
app.get("/project/:id/summary", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("user_projects")
      .select("idea_rating, lean_business_plan, roadmap, progress, mentor_notes, summary, competition_matches, pitch_matches")
      .eq("id", req.params.id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(404).json({ error: err.message || "Not found" });
  }
});

// Update task progress and mark stage complete when all tasks are done
app.post("/progress", async (req, res) => {
  try {
    const { project_id, stage_id, task_id, completed } = ProgressUpdateSchema.parse(req.body);

    const { data: project, error } = await supabase
      .from("user_projects")
      .select("id, progress, roadmap")
      .eq("id", project_id)
      .single();
    if (error) throw error;

    const progress = project.progress || { stages: [] };
    const stageProgress = progress.stages.find((s: any) => s.stage_id === stage_id) || {
      stage_id,
      tasks: [],
      completed: false
    };

    const task = stageProgress.tasks.find((t: any) => t.task_id === task_id) || { task_id, completed: false };
    task.completed = completed;

    if (!stageProgress.tasks.some((t: any) => t.task_id === task_id)) {
      stageProgress.tasks.push(task);
    }
    if (!progress.stages.some((s: any) => s.stage_id === stage_id)) {
      progress.stages.push(stageProgress);
    }

    const roadmapStage = (project.roadmap || []).find((stage: any) => stage.stage_id === stage_id);
    if (roadmapStage) {
      const requiredTaskIds = (roadmapStage.weeks || [])
        .flatMap((week: any) => week.tasks || [])
        .map((t: any) => t.task_id)
        .filter(Boolean);
      const completedIds = stageProgress.tasks.filter((t: any) => t.completed).map((t: any) => t.task_id);
      stageProgress.completed = requiredTaskIds.length > 0 && requiredTaskIds.every((id: string) => completedIds.includes(id));
    }

    const { error: updateError } = await supabase
      .from("user_projects")
      .update({ progress })
      .eq("id", project_id);
    if (updateError) throw updateError;

    res.json({ ok: true, progress });
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Invalid request" });
  }
});

// Filtered competitions query
app.get("/competitions", async (req, res) => {
  try {
    const { domain, stage, team_size, demo_built, requires_plan } = req.query;

    let query = supabase.from("competitions").select("*");
    if (domain) query = query.ilike("domain_focus", `%${domain}%`);
    if (stage) query = query.ilike("stage_fit", `%${stage}%`);
    if (requires_plan !== undefined) query = query.eq("requires_plan", requires_plan === "true");

    const { data, error } = await query;
    if (error) throw error;

    const mapped = (data || []).map((item: any) => ({
      ...item,
      relevance_score: relevanceScore({
        domain: domain as string,
        stage: stage as string,
        demo_built: demo_built === "true",
        requires_demo: item.requires_demo,
        requires_plan: item.requires_plan,
        team_size: team_size ? Number(team_size) : 1,
        team_size_max: item.team_size_max,
        age_min: item.eligibility_age_min,
        age_max: item.eligibility_age_max
      })
    }));

    res.json(mapped);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Invalid request" });
  }
});

// Filtered pitch opportunities query
app.get("/pitch_opportunities", async (req, res) => {
  try {
    const { domain, team_size, demo_built, requires_plan } = req.query;

    let query = supabase.from("pitch_opportunities").select("*");
    if (domain) query = query.ilike("relevance_tags", `%${domain}%`);
    if (requires_plan !== undefined) query = query.eq("requires_plan", requires_plan === "true");

    const { data, error } = await query;
    if (error) throw error;

    const mapped = (data || []).map((item: any) => ({
      ...item,
      relevance_score: relevanceScore({
        domain: domain as string,
        stage: "",
        demo_built: demo_built === "true",
        requires_demo: item.requires_demo,
        requires_plan: item.requires_plan,
        team_size: team_size ? Number(team_size) : 1,
        team_size_max: item.team_size_max,
        age_min: item.eligibility_age_min,
        age_max: item.eligibility_age_max
      })
    }));

    res.json(mapped);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Invalid request" });
  }
});

app.listen(PORT, () => {
  console.log(`LaunchLab API listening on ${PORT}`);
});
