import { supabaseServer } from "./supabaseServer";
import { isMissingTableError } from "./legacyRoadmap";

export type ValidationType = "interview" | "survey" | "waitlist";

type ProgressLogRow = {
  id?: string;
  entry?: string;
  links?: string;
  results?: string;
  created_at?: string;
};

export type ValidationEvent = {
  id: string;
  type: ValidationType;
  entry: string;
  links: string;
  metadata: Record<string, any>;
  created_at: string;
};

export type ValidationStatus = {
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

const TARGETS = {
  interviews: 5,
  surveys: 1,
  waitlist: 20
};

function clampScore(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function safeJsonParse(raw: unknown): Record<string, any> | null {
  if (!raw || typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function inferTypeFromText(text: string): ValidationType | null {
  const normalized = text.toLowerCase();
  if (normalized.includes("interview")) return "interview";
  if (normalized.includes("survey")) return "survey";
  if (normalized.includes("waitlist")) return "waitlist";
  return null;
}

function inferWaitlistCount(text: string) {
  const match = text.match(/\b(\d{1,5})\b/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseValidationEvent(row: ProgressLogRow, index: number): ValidationEvent | null {
  const metadata = safeJsonParse(row.results);
  const explicitType = metadata?.validation_type;
  const inferredType = explicitType || inferTypeFromText(String(row.entry || ""));
  if (!inferredType || !["interview", "survey", "waitlist"].includes(inferredType)) return null;

  const entry = String(row.entry || "");
  const links = String(row.links || "");
  const createdAt = String(row.created_at || new Date().toISOString());
  const baseMeta = metadata || {};

  if (inferredType === "waitlist" && typeof baseMeta.waitlist_count !== "number") {
    const inferred = inferWaitlistCount(`${entry} ${String(row.results || "")}`);
    if (typeof inferred === "number") {
      baseMeta.waitlist_count = inferred;
    }
  }

  return {
    id: String(row.id || `legacy-${index}`),
    type: inferredType as ValidationType,
    entry,
    links,
    metadata: baseMeta,
    created_at: createdAt
  };
}

async function loadProgressLogs(projectId: string) {
  const { data, error } = await supabaseServer
    .from("progress_logs")
    .select("id, entry, links, results, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(500);

  const missingProgressLogs = Boolean(error && isMissingTableError(error, "progress_logs"));
  if (error && !missingProgressLogs) throw new Error(error.message);
  if (!missingProgressLogs) return (data || []) as ProgressLogRow[];

  const { data: legacy, error: legacyError } = await supabaseServer
    .from("user_projects")
    .select("progress")
    .eq("id", projectId)
    .maybeSingle();
  if (legacyError) throw new Error(legacyError.message);

  const logs = Array.isArray(legacy?.progress?.logs) ? legacy.progress.logs : [];
  return logs as ProgressLogRow[];
}

function buildValidationStatus(events: ValidationEvent[]): ValidationStatus {
  let interviewsDone = 0;
  let surveysDone = 0;
  let waitlistCount = 0;

  for (const event of events) {
    if (event.type === "interview") {
      const increment = Number(event.metadata?.count || event.metadata?.interview_count || 1);
      interviewsDone += Number.isFinite(increment) && increment > 0 ? increment : 1;
    }
    if (event.type === "survey") {
      surveysDone += 1;
    }
    if (event.type === "waitlist") {
      const count = Number(event.metadata?.waitlist_count);
      if (Number.isFinite(count)) {
        waitlistCount = Math.max(waitlistCount, count);
      }
    }
  }

  const interviewPct = clampScore((interviewsDone / TARGETS.interviews) * 100);
  const surveyPct = clampScore((surveysDone / TARGETS.surveys) * 100);
  const waitlistPct = clampScore((waitlistCount / TARGETS.waitlist) * 100);
  const readinessScore = clampScore(interviewPct * 0.4 + surveyPct * 0.2 + waitlistPct * 0.4, 0, 100);

  const missingRequirements: string[] = [];
  if (interviewsDone < TARGETS.interviews) {
    missingRequirements.push(`Add ${TARGETS.interviews - interviewsDone} more user interviews.`);
  }
  if (surveysDone < TARGETS.surveys) {
    missingRequirements.push("Create and log at least one survey.");
  }
  if (waitlistCount < TARGETS.waitlist) {
    missingRequirements.push(`Grow waitlist by ${TARGETS.waitlist - waitlistCount} users.`);
  }

  const milestoneReady = missingRequirements.length === 0;
  return {
    interviews_target: TARGETS.interviews,
    interviews_done: interviewsDone,
    surveys_target: TARGETS.surveys,
    surveys_done: surveysDone,
    waitlist_target: TARGETS.waitlist,
    waitlist_count: waitlistCount,
    milestone_ready: milestoneReady,
    missing_requirements: missingRequirements,
    readiness_score: readinessScore,
    gating_note: milestoneReady
      ? "Validation milestone complete. Build and launch stages can unlock."
      : "Validation milestone not complete. Build/launch stages stay locked until requirements are met."
  };
}

export function shouldEnforceValidationGate(stageName: string | null | undefined) {
  const text = String(stageName || "").toLowerCase();
  if (!text) return false;
  const gatedKeywords = [
    "mvp",
    "build",
    "launch",
    "growth",
    "distribution",
    "traction",
    "pitch",
    "competition",
    "funding",
    "scale"
  ];
  return gatedKeywords.some((keyword) => text.includes(keyword));
}

export async function getValidationState(projectId: string) {
  const logs = await loadProgressLogs(projectId);
  const events = logs
    .map((row, index) => parseValidationEvent(row, index))
    .filter((event): event is ValidationEvent => Boolean(event));

  const status = buildValidationStatus(events);
  const latestSurvey =
    events.find((event) => event.type === "survey")?.metadata || null;
  const latestWaitlist =
    events.find((event) => event.type === "waitlist")?.metadata || null;

  return {
    status,
    events: events.slice(0, 30),
    latest_survey: latestSurvey,
    latest_waitlist: latestWaitlist
  };
}

export async function appendValidationEvent(params: {
  project_id: string;
  user_id?: string | null;
  entry: string;
  links?: string;
  metadata: Record<string, any>;
}) {
  const payload = {
    project_id: params.project_id,
    user_id: params.user_id || null,
    entry: params.entry,
    links: params.links || "",
    results: JSON.stringify(params.metadata || {})
  };

  const { error } = await supabaseServer.from("progress_logs").insert(payload);
  const missingProgressLogs = Boolean(error && isMissingTableError(error, "progress_logs"));
  if (error && !missingProgressLogs) throw new Error(error.message);

  if (!missingProgressLogs) return;

  const { data: legacy, error: legacyError } = await supabaseServer
    .from("user_projects")
    .select("progress")
    .eq("id", params.project_id)
    .maybeSingle();
  if (legacyError) throw new Error(legacyError.message);

  const seed = legacy?.progress && typeof legacy.progress === "object" ? legacy.progress : {};
  const logs = Array.isArray(seed.logs) ? seed.logs : [];
  logs.unshift({
    entry: params.entry,
    links: params.links || "",
    results: JSON.stringify(params.metadata || {}),
    created_at: new Date().toISOString()
  });

  const { error: saveError } = await supabaseServer
    .from("user_projects")
    .update({ progress: { ...seed, logs: logs.slice(0, 250) } })
    .eq("id", params.project_id);
  if (saveError) throw new Error(saveError.message);
}
