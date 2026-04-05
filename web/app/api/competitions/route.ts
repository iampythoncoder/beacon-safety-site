import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";
import { isMissingTableError } from "../../../lib/legacyRoadmap";
import { buildFallbackCompetitions } from "../../../lib/opportunities";

export const runtime = "nodejs";

const fallbackCompetitions = buildFallbackCompetitions(520);
const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "that",
  "this",
  "your",
  "you",
  "into",
  "of",
  "to",
  "in",
  "a",
  "an",
  "on",
  "at",
  "by",
  "is",
  "are",
  "as"
]);

function matches(value: unknown, query: string | null) {
  if (!query) return true;
  return String(value || "").toLowerCase().includes(query.toLowerCase());
}

function applyFilters(
  source: any[],
  filters: { domain: string | null; stage: string | null; location: string | null }
) {
  return source.filter((item) => {
    const domainMatch =
      matches(item.domain_focus, filters.domain) ||
      matches(item.category, filters.domain) ||
      matches(item.name, filters.domain);
    const stageMatch = matches(item.stage_fit, filters.stage);
    const locationMatch = matches(item.location, filters.location);
    return domainMatch && stageMatch && locationMatch;
  });
}

function mergeWithFallback(primary: any[], fallback: any[], minCount = 260) {
  if (primary.length >= minCount) return primary;
  const seen = new Set(primary.map((item) => String(item.name || "").toLowerCase()));
  const merged = [...primary];
  for (const row of fallback) {
    const key = String(row.name || "").toLowerCase();
    if (seen.has(key)) continue;
    merged.push(row);
    seen.add(key);
    if (merged.length >= minCount) break;
  }
  return merged;
}

function normalizeName(name: unknown) {
  return String(name || "")
    .toLowerCase()
    .replace(/\s+(national|regional|global|virtual)\s+(spring|summer|fall|winter)\s+20\d{2}$/i, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function qualityScore(item: any) {
  let score = 0;
  if (item.application_link) score += 2;
  if (item.description || item.notes) score += 1;
  if (item.judging_focus) score += 1;
  if (item.deadline) score += 1;
  if (item.data_status !== "fallback") score += 2;
  return score;
}

function dedupeCompetitions(rows: any[]) {
  const map = new Map<string, any>();
  for (const row of rows) {
    const key = `${normalizeName(row.name)}|${String(row.application_link || "").toLowerCase()}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, row);
      continue;
    }
    if (qualityScore(row) > qualityScore(existing)) {
      map.set(key, row);
    }
  }
  return Array.from(map.values());
}

function inferProgression(item: any) {
  if (Array.isArray(item.progression) && item.progression.length > 0) return item.progression;

  const name = String(item.name || "").toLowerCase();
  const location = String(item.location || "").toLowerCase();

  if (
    name.includes("fbla") ||
    name.includes("deca") ||
    name.includes("olympiad") ||
    name.includes("bpa") ||
    name.includes("skillsusa")
  ) {
    return ["District", "State", "Nationals"];
  }

  if (name.includes("isef")) {
    return ["School fair", "Regional fair", "State fair", "ISEF finals"];
  }

  if (name.includes("first robotics") || name.includes("first tech") || name.includes("robotics")) {
    return ["Regional qualifier", "Super-regional", "World or nationals final"];
  }

  if (name.includes("hackathon") || name.includes("build challenge")) {
    return ["Submission", "Technical review", "Final demo"];
  }

  if (location.includes("global")) {
    return ["Application", "National qualifier", "Global semifinal", "Global finals"];
  }

  return ["Application", "Semifinal", "Final"];
}

function describeCompetition(item: any) {
  const category = item.category || "General";
  const stage = item.stage_fit || "any stage";
  const judging = item.judging_focus || "Execution quality and founder clarity";
  const location = item.location || "global";
  const requirements = [
    item.requires_demo ? "demo required" : "demo optional",
    item.requires_plan ? "business plan required" : "business plan optional"
  ].join(", ");
  return `${category} competition for ${stage} founders in ${location}. ${requirements}. Judging focus: ${judging}.`;
}

function summarizeCompetition(item: any) {
  const category = item.category || "General";
  const stage = item.stage_fit || "Any stage";
  const location = item.location || "Global";
  const demo = item.requires_demo ? "demo required" : "demo optional";
  const plan = item.requires_plan ? "plan required" : "plan optional";
  return `${category} · ${stage} · ${location} · ${demo} · ${plan}`;
}

function toBool(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y"].includes(normalized)) return true;
    if (["false", "0", "no", "n"].includes(normalized)) return false;
  }
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  return null;
}

function clampScore(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function seededUnit(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 1000) / 999;
}

function tokenize(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function tokenSimilarity(a: string, b: string) {
  const aSet = new Set(tokenize(a));
  const bSet = new Set(tokenize(b));
  if (!aSet.size || !bSet.size) return 0;
  let intersection = 0;
  for (const token of aSet) {
    if (bSet.has(token)) intersection += 1;
  }
  const union = new Set([...aSet, ...bSet]).size;
  if (!union) return 0;
  return intersection / union;
}

function stageRank(value: string) {
  const text = value.toLowerCase();
  if (text.includes("ideation") || text.includes("explor") || text.includes("problem")) return 1;
  if (text.includes("research")) return 2;
  if (text.includes("prototype")) return 2;
  if (text.includes("mvp") || text.includes("build")) return 3;
  if (text.includes("launch") || text.includes("pilot") || text.includes("beta")) return 4;
  if (text.includes("growth") || text.includes("scale")) return 5;
  return 3;
}

function scoreDomainAlignment(project: any, item: any) {
  if (!project?.domain) return 74;
  const projectText = `${project.domain} ${project.goal || ""}`;
  const itemText = `${item.domain_focus || ""} ${item.category || ""} ${item.name || ""}`;
  const similarity = tokenSimilarity(projectText, itemText);
  const directMatch =
    matches(item.domain_focus, project.domain) ||
    matches(item.category, project.domain) ||
    matches(item.name, project.domain);
  return clampScore(58 + similarity * 30 + (directMatch ? 12 : 0), 48, 99);
}

function scoreStageAlignment(project: any, item: any) {
  if (!project?.stage) return 76;
  const p = stageRank(String(project.stage || ""));
  const c = stageRank(String(item.stage_fit || ""));
  const diff = Math.abs(p - c);
  const byDiff = [100, 90, 79, 68, 58];
  return byDiff[Math.min(diff, byDiff.length - 1)];
}

function scoreGoalAlignment(project: any, item: any) {
  if (!project?.goal) return 72;
  const projectGoal = String(project.goal || "");
  const itemText = `${item.judging_focus || ""} ${item.category || ""} ${item.domain_focus || ""}`;
  const similarity = tokenSimilarity(projectGoal, itemText);
  const directMatch = matches(item.category, projectGoal) || matches(item.judging_focus, projectGoal);
  return clampScore(56 + similarity * 34 + (directMatch ? 10 : 0), 45, 98);
}

function scoreReadiness(project: any, item: any) {
  const requiresDemo = toBool(item.requires_demo);
  const requiresPlan = toBool(item.requires_plan);
  const demoBuilt = Boolean(project?.demo_built);
  const demoScore =
    requiresDemo === true ? (demoBuilt ? 96 : 68) : demoBuilt ? 90 : 93;
  const planScore = requiresPlan === true ? 82 : 94;
  return clampScore(demoScore * 0.62 + planScore * 0.38, 50, 98);
}

function scoreAccessibility(project: any, item: any) {
  const location = String(item.location || "").toLowerCase();
  let locationScore = 82;
  if (location.includes("global") || location.includes("virtual") || location.includes("online")) {
    locationScore = 96;
  } else if (location.includes("usa") || location.includes("united states") || location.includes("us")) {
    locationScore = 90;
  } else if (location.includes("north america")) {
    locationScore = 86;
  } else if (location.includes("europe") || location.includes("asia")) {
    locationScore = 84;
  }

  const teamSize = Number(project?.team_size || 1);
  const teamMax = Number(item.team_size_max || 8);
  const teamScore = teamSize <= teamMax ? 94 : 70;
  const ageMin = Number(item.eligibility_age_min || 13);
  const ageMax = Number(item.eligibility_age_max || 19);
  const ageScore = ageMin <= 16 && ageMax >= 17 ? 95 : 86;
  return clampScore(locationScore * 0.6 + teamScore * 0.2 + ageScore * 0.2, 55, 98);
}

function scoreJudgingAlignment(project: any, item: any) {
  const projectText = `${project?.stage || ""} ${project?.goal || ""} ${project?.domain || ""}`;
  const judging = `${item.judging_focus || ""} ${item.description || ""}`;
  const similarity = tokenSimilarity(projectText, judging);
  return clampScore(56 + similarity * 38, 48, 96);
}

function parseDeadline(deadline: unknown) {
  const raw = String(deadline || "").trim();
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function inferDeadline(item: any) {
  const existing = parseDeadline(item.deadline);
  if (existing) return existing.toISOString();

  const name = String(item.name || "").toLowerCase();
  const seasonMatch = name.match(/\b(spring|summer|fall|winter)\b/);
  const yearMatch = name.match(/\b(20\d{2})\b/);
  if (!seasonMatch) return null;

  const year = yearMatch ? Number(yearMatch[1]) : new Date().getFullYear();
  const season = seasonMatch[1];
  const monthBySeason: Record<string, number> = { spring: 3, summer: 6, fall: 9, winter: 12 };
  const month = monthBySeason[season] ?? 9;
  const inferred = new Date(Date.UTC(year, month - 1, 20));
  return inferred.toISOString();
}

function countdownInfo(deadlineIso: string | null) {
  if (!deadlineIso) {
    return {
      deadline_countdown_days: null as number | null,
      deadline_label: "Rolling / no published deadline",
      deadline_urgency: "rolling" as const
    };
  }

  const deadline = parseDeadline(deadlineIso);
  if (!deadline) {
    return {
      deadline_countdown_days: null as number | null,
      deadline_label: "Deadline format unavailable",
      deadline_urgency: "rolling" as const
    };
  }

  const now = new Date();
  const ms = deadline.getTime() - now.getTime();
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  if (days < 0) {
    return {
      deadline_countdown_days: days,
      deadline_label: `Deadline passed ${Math.abs(days)} days ago`,
      deadline_urgency: "passed" as const
    };
  }
  if (days <= 7) {
    return {
      deadline_countdown_days: days,
      deadline_label: `${days} days left`,
      deadline_urgency: "critical" as const
    };
  }
  if (days <= 21) {
    return {
      deadline_countdown_days: days,
      deadline_label: `${days} days left`,
      deadline_urgency: "soon" as const
    };
  }
  return {
    deadline_countdown_days: days,
    deadline_label: `${days} days left`,
    deadline_urgency: "normal" as const
  };
}

function buildWinnerPatterns(item: any, project: any) {
  const category = String(item.category || "").toLowerCase();
  const judging = String(item.judging_focus || "").toLowerCase();
  const stage = String(item.stage_fit || "").toLowerCase();
  const projectStage = String(project?.stage || "").toLowerCase();
  const patterns: Array<{ title: string; insight: string; action: string }> = [];
  const signals: string[] = [];

  if (judging.includes("traction") || judging.includes("validation")) {
    patterns.push({
      title: "Proof-first submissions",
      insight: "Top finalists usually include evidence of user demand and measurable traction.",
      action: "Show 3+ user interviews or early signups before applying."
    });
    signals.push("Winners usually show real user proof before final judging.");
  }

  if (judging.includes("execution") || judging.includes("prototype")) {
    patterns.push({
      title: "Prototype clarity",
      insight: "Judges score higher when teams show a working prototype and clear technical choices.",
      action: "Record a concise demo with one core user flow and architecture snapshot."
    });
    signals.push("Execution quality consistently separates finalists from semifinalists.");
  }

  if (category.includes("social") || category.includes("climate") || category.includes("impact")) {
    patterns.push({
      title: "Impact quantification",
      insight: "Winning teams quantify impact with concrete before/after metrics instead of broad claims.",
      action: "Include one measurable KPI and baseline value in your submission."
    });
    signals.push("Winning teams quantify impact with measurable before/after outcomes.");
  }

  if (category.includes("research") || judging.includes("rigor") || judging.includes("methodology")) {
    patterns.push({
      title: "Research rigor",
      insight: "Historical winners in research-heavy categories provide stronger methodology and reproducibility.",
      action: "Document methods, assumptions, and limitations in one concise appendix."
    });
    signals.push("Winning submissions include strong methodology, evidence, and reproducibility.");
  }

  if (category.includes("business") || category.includes("entrepreneurship") || judging.includes("market")) {
    patterns.push({
      title: "Business model realism",
      insight: "Judges reward realistic monetization, distribution strategy, and customer acquisition math.",
      action: "Add a one-page GTM and pricing model with assumptions."
    });
    signals.push("Judges reward clear monetization logic and realistic go-to-market plans.");
  }

  if (stage.includes("mvp") || stage.includes("launch") || projectStage.includes("mvp")) {
    patterns.push({
      title: "Story + execution pairing",
      insight: "MVP-stage finalists pair a compelling founder story with specific delivery milestones.",
      action: "Present a 30-60-90 day execution plan tied to one outcome metric."
    });
    signals.push("Finalists combine narrative clarity with concrete next milestones.");
  }

  if (patterns.length === 0) {
    patterns.push({
      title: "Polished fundamentals",
      insight: "Across most programs, winners combine a clear problem statement, demo evidence, and concise pitch narrative.",
      action: "Tighten problem, demo, and traction slides before submission."
    });
  }
  if (signals.length === 0) {
    signals.push("Top winners typically combine a polished demo, clear storytelling, and measurable proof.");
  }

  return {
    summary: "Historical winners tend to combine strong proof, clear narrative, and execution speed.",
    patterns: patterns.slice(0, 5),
    signals: signals.slice(0, 4)
  };
}

function buildChecklistAndMissing(item: any, project: any, hasBusinessPlan: boolean, deadlineIso: string | null) {
  const requiresDemo = toBool(item.requires_demo) === true;
  const requiresPlan = toBool(item.requires_plan) === true;
  const teamSize = Number(project?.team_size || 1);
  const teamMax = Number(item.team_size_max || 8);
  const projectStageRank = stageRank(String(project?.stage || ""));
  const targetStageRank = stageRank(String(item.stage_fit || ""));
  const stageGap = Math.max(0, targetStageRank - projectStageRank);
  const deadline = countdownInfo(deadlineIso);
  const hasDemo = Boolean(project?.demo_built);
  const hasValidation = projectStageRank >= 2 || Boolean(project?.has_validation);

  const checklist = [
    {
      id: "eligibility",
      label: `Confirm eligibility (ages ${item.eligibility_age_min || 13}-${item.eligibility_age_max || 19}, team up to ${teamMax})`,
      done: teamSize <= teamMax,
      required: true
    },
    {
      id: "validation",
      label: "Attach proof: interviews, pilot data, or early user demand signals",
      done: hasValidation,
      required: true
    },
    {
      id: "plan",
      label: requiresPlan ? "Prepare a competition-ready business plan and one-page summary" : "Business plan optional (recommended)",
      done: !requiresPlan || hasBusinessPlan,
      required: requiresPlan
    },
    {
      id: "demo",
      label: requiresDemo ? "Record a working demo + 60-second walkthrough" : "Demo optional (recommended for stronger scoring)",
      done: !requiresDemo || hasDemo,
      required: requiresDemo
    },
    {
      id: "story",
      label: "Finalize pitch narrative (problem, proof, why now, why your team)",
      done: hasBusinessPlan || hasDemo || hasValidation,
      required: true
    },
    {
      id: "submission",
      label: "Submit complete artifacts and links before deadline",
      done: false,
      required: true
    }
  ];

  const missing: string[] = [];
  if (teamSize > teamMax) missing.push(`Reduce team size to ${teamMax} or fewer.`);
  if (requiresPlan && !hasBusinessPlan) missing.push("Business plan / one-pager is missing.");
  if (requiresDemo && !hasDemo) missing.push("Working demo is missing.");
  if (!hasValidation) missing.push("Validation proof is missing (interviews, waitlist, or pilot data).");
  if (stageGap >= 2) {
    missing.push(`Project stage looks early for this opportunity (${project?.stage || "Current"} -> ${item.stage_fit || "Target"}).`);
  }
  if (deadline.deadline_urgency === "passed") missing.push("Application window appears closed.");
  if (deadline.deadline_urgency === "critical") missing.push("Submission deadline is in under 7 days.");

  const requiredChecklist = checklist.filter((entry) => entry.required);
  const completedRequired = requiredChecklist.filter((entry) => entry.done).length;
  const readiness_percent = requiredChecklist.length
    ? clampScore((completedRequired / requiredChecklist.length) * 100, 0, 100)
    : 0;

  const qualification_gap =
    missing.length > 0
      ? `You're missing ${missing.length} requirement${missing.length === 1 ? "" : "s"} to qualify strongly.`
      : "You meet the core qualification requirements for this competition.";

  const missing_to_qualify =
    missing.length > 0
      ? `You're missing ${missing.length} to qualify: ${missing.slice(0, 2).join(" ")}`
      : "No blocking qualification gaps detected.";

  return { checklist, missing, qualification_gap, missing_to_qualify, readiness_percent };
}

function average(values: Array<number | undefined>) {
  const cleaned = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (!cleaned.length) return 0;
  return cleaned.reduce((sum, value) => sum + value, 0) / cleaned.length;
}

function computeWinProbability(finalScore: number, intelligence: any, matchBreakdown: any) {
  const missingCount = Array.isArray(intelligence?.missing_requirements) ? intelligence.missing_requirements.length : 0;
  const checklist = Array.isArray(intelligence?.auto_checklist) ? intelligence.auto_checklist : [];
  const completedChecklist = checklist.filter((entry: any) => entry?.done).length;
  const checklistCompletion = checklist.length > 0 ? completedChecklist / checklist.length : 0;
  const readiness = Number(intelligence?.readiness_percent || 0);
  const urgency = String(intelligence?.deadline_urgency || "normal");
  const urgencyPenalty = urgency === "passed" ? 22 : urgency === "critical" ? 8 : urgency === "soon" ? 4 : 0;

  const strategic = average([
    matchBreakdown?.domain_alignment,
    matchBreakdown?.stage_alignment,
    matchBreakdown?.goal_alignment
  ]);
  const execution = average([matchBreakdown?.readiness_fit, matchBreakdown?.judging_alignment]);
  const access = average([matchBreakdown?.accessibility_fit, matchBreakdown?.data_quality]);
  const prestige = Number(matchBreakdown?.prestige_fit || 70);

  const raw =
    finalScore * 0.55 +
    strategic * 0.2 +
    execution * 0.12 +
    access * 0.08 +
    readiness * 0.05 +
    checklistCompletion * 8 +
    (prestige - 72) * 0.08 -
    missingCount * 6.5 -
    urgencyPenalty;

  const win_probability = clampScore(raw, 12, 96);
  const win_probability_label =
    win_probability >= 86
      ? "Strong shot"
      : win_probability >= 74
        ? "Competitive"
        : win_probability >= 62
          ? "Possible"
          : "Long shot";
  const confidence = clampScore(average([matchBreakdown?.data_quality, readiness, 100 - missingCount * 14]), 18, 95);
  return { win_probability, win_probability_label, confidence };
}

function scorePrestige(item: any) {
  const text = `${item.name || ""} ${item.category || ""}`.toLowerCase();
  let score = 58;
  if (text.includes("y combinator") || text.includes("yc")) score += 22;
  if (text.includes("mit") || text.includes("stanford") || text.includes("harvard")) score += 14;
  if (text.includes("isef") || text.includes("deca") || text.includes("fbla")) score += 12;
  if (text.includes("nasa") || text.includes("ces") || text.includes("conrad")) score += 10;
  if (text.includes("global")) score += 6;
  if (text.includes("regional")) score -= 3;
  return clampScore(score, 50, 98);
}

function scoreDataQuality(item: any) {
  let score = 66;
  if (item.application_link) score += 10;
  if (item.description || item.notes) score += 8;
  if (item.judging_focus) score += 6;
  if (item.deadline) score += 4;
  if (item.data_status !== "fallback") score += 6;
  return clampScore(score, 55, 97);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get("domain");
    const stage = searchParams.get("stage");
    const location = searchParams.get("location");
    const projectId = searchParams.get("project_id");

    const query = supabaseServer.from("competitions").select("*").limit(1200);
    let data: any[] = [];
    const result = await query;
    if (result.error) {
      if (isMissingTableError(result.error, "competitions")) {
        data = fallbackCompetitions.slice();
      } else {
        throw new Error(result.error.message);
      }
    } else {
      data = mergeWithFallback(result.data || [], fallbackCompetitions, 360);
    }
    if (data.length === 0) data = fallbackCompetitions.slice();
    data = dedupeCompetitions(data);
    data = applyFilters(data, { domain, stage, location });

    let project: any = null;
    let hasBusinessPlan = false;
    if (projectId) {
      const { data: projectRow, error: projectError } = await supabaseServer
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .maybeSingle();
      if (!projectError) {
        project = projectRow;
      } else if (isMissingTableError(projectError, "projects")) {
        const { data: legacy } = await supabaseServer
          .from("user_projects")
          .select("project_input")
          .eq("id", projectId)
          .maybeSingle();
        const input = legacy?.project_input || {};
        project = {
          domain: input.domain || "General",
          stage: input.stage || "Ideation",
          demo_built: Boolean(input.demo_built)
        };
      } else {
        throw new Error(projectError.message);
      }

      const { data: planRow, error: planError } = await supabaseServer
        .from("business_plans")
        .select("id")
        .eq("project_id", projectId)
        .limit(1)
        .maybeSingle();
      if (!planError) {
        hasBusinessPlan = Boolean(planRow?.id);
      } else if (isMissingTableError(planError, "business_plans")) {
        const { data: legacy } = await supabaseServer
          .from("user_projects")
          .select("lean_business_plan")
          .eq("id", projectId)
          .maybeSingle();
        const plan = legacy?.lean_business_plan;
        hasBusinessPlan = Boolean(plan && typeof plan === "object" && Object.keys(plan).length > 0);
      } else {
        throw new Error(planError.message);
      }
    }

    const scored = (data || []).map((item) => {
      const requiresDemo = toBool(item.requires_demo);
      const requiresPlan = toBool(item.requires_plan);
      const deadlineIso = item.deadline || inferDeadline(item);

      const domainAlignment = scoreDomainAlignment(project, item);
      const stageAlignment = scoreStageAlignment(project, item);
      const goalAlignment = scoreGoalAlignment(project, item);
      const readinessFit = scoreReadiness(project, item);
      const accessibilityFit = scoreAccessibility(project, item);
      const judgingAlignment = scoreJudgingAlignment(project, item);
      const prestigeFit = scorePrestige(item);
      const dataQuality = scoreDataQuality(item);
      const rawComposite = clampScore(
        domainAlignment * 0.24 +
          stageAlignment * 0.18 +
          goalAlignment * 0.16 +
          readinessFit * 0.14 +
          accessibilityFit * 0.1 +
          judgingAlignment * 0.08 +
          prestigeFit * 0.06 +
          dataQuality * 0.04,
        0,
        100
      );
      const deadlineTracker = countdownInfo(deadlineIso);
      const checklistData = buildChecklistAndMissing(item, project, hasBusinessPlan, deadlineIso);
      const winnerPatterns = buildWinnerPatterns(item, project);
      const intelligenceBase = {
        ...deadlineTracker,
        auto_checklist: checklistData.checklist,
        missing_requirements: checklistData.missing,
        qualification_gap: checklistData.qualification_gap,
        missing_to_qualify: checklistData.missing_to_qualify,
        readiness_percent: checklistData.readiness_percent,
        winner_patterns: winnerPatterns
      };

      return {
        ...item,
        requires_demo: requiresDemo === true,
        requires_plan: requiresPlan === true,
        deadline: deadlineIso,
        summary: item.summary || summarizeCompetition(item),
        description: item.description || item.notes || describeCompetition(item),
        progression: inferProgression(item),
        competition_intelligence: intelligenceBase,
        match_breakdown: {
          domain_alignment: domainAlignment,
          stage_alignment: stageAlignment,
          goal_alignment: goalAlignment,
          readiness_fit: readinessFit,
          accessibility_fit: accessibilityFit,
          judging_alignment: judgingAlignment,
          prestige_fit: prestigeFit,
          data_quality: dataQuality,
          raw_composite: rawComposite
        },
        _raw_score: rawComposite
      };
    });
    const rawValues = scored.map((item) => Number(item._raw_score || 0));
    const minRaw = rawValues.length ? Math.min(...rawValues) : 0;
    const maxRaw = rawValues.length ? Math.max(...rawValues) : 100;

    const calibrated = scored.map((item) => {
      const raw = Number(item._raw_score || 0);
      const varianceSeed = seededUnit(`${item.id || item.name || "competition"}:${item.name || ""}`);
      const rangeNorm = maxRaw === minRaw ? varianceSeed : (raw - minRaw) / (maxRaw - minRaw);
      const percentileCalibrated = 72 + rangeNorm * 24;
      const leniencyLift = 3 + varianceSeed * 4;
      const finalScore = clampScore(raw * 0.4 + percentileCalibrated * 0.6 + leniencyLift, 68, 99);
      const probability = computeWinProbability(finalScore, item.competition_intelligence, item.match_breakdown);
      return {
        ...item,
        match_score: finalScore,
        competition_intelligence: {
          ...(item.competition_intelligence || {}),
          ...probability
        },
        match_breakdown: {
          ...item.match_breakdown,
          calibrated_score: finalScore
        }
      };
    });

    calibrated.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
    return NextResponse.json(
      calibrated.map(({ _raw_score, ...item }) => item)
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load competitions" }, { status: 500 });
  }
}
