import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";
import { isMissingTableError } from "../../../lib/legacyRoadmap";

export const runtime = "nodejs";

const DEFAULT_IDEA_RATING = {
  scope: 72,
  complexity: 63,
  market_fit: 70,
  competition_density: 55,
  feasibility: 74
};

const DEFAULT_ASPECTS = [
  { aspect: "Problem Clarity", key: "scope" as const },
  { aspect: "User Urgency", key: "market_fit" as const },
  { aspect: "Differentiation", key: "competition_density" as const },
  { aspect: "Distribution", key: "market_fit" as const },
  { aspect: "Monetization Potential", key: "feasibility" as const },
  { aspect: "Technical Execution Risk", key: "complexity" as const },
  { aspect: "Competition Readiness", key: "competition_density" as const },
  { aspect: "Founder Advantage", key: "feasibility" as const }
];

type MetricDetail = {
  reason: string;
  improve_with: string;
};

type AspectFeedbackItem = {
  aspect: string;
  score: number;
  strength: string;
  risk: string;
  next_action: string;
};

type NormalizedIdeaRating = typeof DEFAULT_IDEA_RATING;

function normalizeIdeaRating(raw: Record<string, any> | null | undefined) {
  const source = raw && typeof raw === "object" ? raw : {};
  const getNum = (keys: string[]) => {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === "number" && Number.isFinite(value)) {
        return Math.max(0, Math.min(100, Math.round(value)));
      }
    }
    return 0;
  };

  const normalized = {
    scope: getNum(["scope"]),
    complexity: getNum(["complexity"]),
    market_fit: getNum(["market_fit", "marketFit", "market"]),
    competition_density: getNum(["competition_density", "competitionDensity", "competition"]),
    feasibility: getNum(["feasibility"])
  };

  const values = Object.values(normalized);
  const allZero = values.every((value) => value <= 0);
  return allZero ? DEFAULT_IDEA_RATING : normalized;
}

function defaultReason(metric: keyof NormalizedIdeaRating, score: number) {
  const scoreBand = score >= 78 ? "strong" : score >= 62 ? "promising" : "early";
  const reasons: Record<keyof NormalizedIdeaRating, string> = {
    scope:
      scoreBand === "strong"
        ? "The target problem and user segment are clear enough for focused execution."
        : scoreBand === "promising"
          ? "Your direction is promising but still broad for a first launch."
          : "Scope is currently too wide and risks slowing execution.",
    complexity:
      scoreBand === "strong"
        ? "The build path is realistic with current tools and timeline."
        : scoreBand === "promising"
          ? "Complexity is manageable if you keep the first version narrow."
          : "Execution complexity is high relative to current constraints.",
    market_fit:
      scoreBand === "strong"
        ? "There is good alignment between user pain and your current solution approach."
        : scoreBand === "promising"
          ? "The problem is meaningful, but proof of demand is still thin."
          : "Problem-solution fit is unclear and needs direct user validation.",
    competition_density:
      scoreBand === "strong"
        ? "You have enough differentiation signals to compete effectively."
        : scoreBand === "promising"
          ? "Competition is real; positioning and proof should be tighter."
          : "The market is crowded without clear differentiation yet.",
    feasibility:
      scoreBand === "strong"
        ? "The next milestone is realistic if execution remains consistent."
        : scoreBand === "promising"
          ? "Feasible with disciplined prioritization and weekly shipping."
          : "Current plan needs simplification to become executable."
  };
  return reasons[metric];
}

function defaultImprove(metric: keyof NormalizedIdeaRating) {
  const improvements: Record<keyof NormalizedIdeaRating, string> = {
    scope: "Pick one user segment and define one measurable outcome for the next two weeks.",
    complexity: "Cut non-essential features and ship one end-to-end workflow first.",
    market_fit: "Run 8 to 10 user interviews and capture concrete willingness-to-use signals.",
    competition_density: "Define your wedge in one sentence and show measurable proof weekly.",
    feasibility: "Set a weekly execution cadence with deliverables and progress checks."
  };
  return improvements[metric];
}

function normalizeIdeaRatingDetails(
  raw: Record<string, any> | null | undefined,
  rating: NormalizedIdeaRating
): Record<keyof NormalizedIdeaRating, MetricDetail> {
  const source = raw && typeof raw === "object" ? raw : {};
  const keys = Object.keys(rating) as Array<keyof NormalizedIdeaRating>;
  const details = {} as Record<keyof NormalizedIdeaRating, MetricDetail>;

  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      details[key] = {
        reason: value.trim(),
        improve_with: defaultImprove(key)
      };
      continue;
    }
    if (value && typeof value === "object") {
      const reason = String((value as any).reason || "").trim();
      const improveWith = String((value as any).improve_with || (value as any).improveWith || "").trim();
      details[key] = {
        reason: reason || defaultReason(key, rating[key]),
        improve_with: improveWith || defaultImprove(key)
      };
      continue;
    }
    details[key] = {
      reason: defaultReason(key, rating[key]),
      improve_with: defaultImprove(key)
    };
  }

  return details;
}

function clampScore(value: unknown, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function buildDefaultAspectFeedback(
  rating: NormalizedIdeaRating,
  details: Record<keyof NormalizedIdeaRating, MetricDetail>
): AspectFeedbackItem[] {
  return DEFAULT_ASPECTS.map((item) => {
    const baseScore = rating[item.key];
    const strength = details[item.key]?.reason || "Promising signal with clear execution potential.";
    const nextAction = details[item.key]?.improve_with || "Run a focused execution sprint with measurable outcomes.";
    return {
      aspect: item.aspect,
      score: baseScore,
      strength,
      risk:
        baseScore >= 75
          ? "Main risk is losing momentum if weekly milestones are not maintained."
          : baseScore >= 60
            ? "Risk is moderate until this area is validated with direct evidence."
            : "Risk is high and requires immediate focus before expanding scope.",
      next_action: nextAction
    };
  });
}

function normalizeIdeaAspectFeedback(
  raw: unknown,
  rating: NormalizedIdeaRating,
  details: Record<keyof NormalizedIdeaRating, MetricDetail>
) {
  const defaults = buildDefaultAspectFeedback(rating, details);
  const byAspect = new Map(defaults.map((item) => [item.aspect.toLowerCase(), item]));
  const list: unknown[] = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object"
      ? Object.entries(raw as Record<string, any>).map(([aspect, value]) =>
          value && typeof value === "object" ? { aspect, ...(value as any) } : { aspect, strength: String(value || "") }
        )
      : [];

  for (const entry of list) {
    if (!entry || typeof entry !== "object") continue;
    const value = entry as Record<string, any>;
    const aspectName = String(value.aspect || "").trim();
    if (!aspectName) continue;
    const key = aspectName.toLowerCase();
    const fallback = byAspect.get(key);
    const fallbackScore = fallback?.score || 68;
    const merged: AspectFeedbackItem = {
      aspect: aspectName,
      score: clampScore(value.score, fallbackScore),
      strength: String(value.strength || value.reason || fallback?.strength || "Promising execution signal."),
      risk: String(value.risk || fallback?.risk || "Validation risk remains until evidence improves."),
      next_action: String(
        value.next_action ||
          value.nextAction ||
          value.improve_with ||
          fallback?.next_action ||
          "Define one measurable milestone and execute this week."
      )
    };
    byAspect.set(key, merged);
  }

  const merged = Array.from(byAspect.values());
  return merged.sort((a, b) => b.score - a.score);
}

function isBadFeedbackText(value: unknown) {
  const text = String(value || "").toLowerCase();
  return text.includes("groq_api_key not set") || text.includes("api key not set");
}

function fallbackIdeaFeedback(rating: Record<string, any>) {
  const scores = Object.values(rating || {}).filter((v) => typeof v === "number") as number[];
  if (!scores.length) {
    return "Clarify the exact user pain, ship one measurable milestone, and collect proof from real users this week.";
  }
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  if (avg >= 75) {
    return "Strong foundation. Focus on traction proof: user interviews, waitlist conversion, and one shipped milestone.";
  }
  if (avg >= 60) {
    return "Promising direction. Tighten the scope and validate demand before adding features.";
  }
  return "Early-stage idea. Narrow to one user segment and validate the problem with direct interviews first.";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("project_id");
  const userId = searchParams.get("user_id");
  if (!projectId) return NextResponse.json({ error: "Missing project_id" }, { status: 400 });

  const { data, error } = await supabaseServer
    .from("business_plans")
    .select("*")
    .eq("project_id", projectId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const missingBusinessPlans = Boolean(error && isMissingTableError(error, "business_plans"));
  if (error && !missingBusinessPlans) return NextResponse.json({ error: error.message }, { status: 500 });
  if (data) {
    const payload = { ...data };
    const rating = normalizeIdeaRating(payload?.plan?.idea_rating);
    const details = normalizeIdeaRatingDetails(payload?.plan?.idea_rating_details, rating);
    const aspects = normalizeIdeaAspectFeedback(payload?.plan?.idea_aspect_feedback, rating, details);
    if (payload?.plan) {
      payload.plan.idea_rating = rating;
      payload.plan.idea_rating_details = details;
      payload.plan.idea_aspect_feedback = aspects;
    }
    if (payload?.plan && (!payload.plan.idea_feedback || isBadFeedbackText(payload.plan.idea_feedback))) {
      payload.plan.idea_feedback = fallbackIdeaFeedback(rating);
    }
    return NextResponse.json(payload);
  }

  let { data: legacy, error: legacyError } = await supabaseServer
    .from("user_projects")
    .select("id, idea_rating, lean_business_plan, mentor_notes, summary, created_at")
    .eq("id", projectId)
    .maybeSingle();
  if (!legacy && !legacyError) {
    const alt = await supabaseServer
      .from("user_projects")
      .select("id, idea_rating, lean_business_plan, mentor_notes, summary, created_at")
      .filter("project_input->>generated_project_id", "eq", projectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    legacy = alt.data;
    legacyError = alt.error;
  }
  if (!legacy && !legacyError && userId) {
    const altByUser = await supabaseServer
      .from("user_projects")
      .select("id, idea_rating, lean_business_plan, mentor_notes, summary, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    legacy = altByUser.data;
    legacyError = altByUser.error;
  }
  if (legacyError) return NextResponse.json({ error: legacyError.message }, { status: 500 });
  if (!legacy) return NextResponse.json(null);

  const normalizedRating = normalizeIdeaRating((legacy.idea_rating || {}) as Record<string, any>);
  const normalizedDetails = normalizeIdeaRatingDetails(undefined, normalizedRating);
  const normalizedAspects = normalizeIdeaAspectFeedback(
    (legacy.lean_business_plan as any)?.idea_aspect_feedback,
    normalizedRating,
    normalizedDetails
  );

  return NextResponse.json({
    id: `legacy-${legacy.id}`,
    project_id: projectId,
    version: 1,
    created_at: legacy.created_at,
    plan: {
      idea_rating: normalizedRating,
      idea_rating_details: normalizedDetails,
      idea_aspect_feedback: normalizedAspects,
      idea_feedback:
        !legacy.summary || isBadFeedbackText(legacy.summary)
          ? fallbackIdeaFeedback(normalizedRating)
          : legacy.summary,
      business_plan: legacy.lean_business_plan || {},
      mentor_summary: legacy.mentor_notes || {},
      summary: legacy.summary || ""
    }
  });
}
