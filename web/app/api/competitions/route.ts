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
    }

    const scored = (data || []).map((item) => {
      const requiresDemo = toBool(item.requires_demo);
      const requiresPlan = toBool(item.requires_plan);

      const domainAlignment = scoreDomainAlignment(project, item);
      const stageAlignment = scoreStageAlignment(project, item);
      const goalAlignment = scoreGoalAlignment(project, item);
      const readinessFit = scoreReadiness(project, item);
      const accessibilityFit = scoreAccessibility(project, item);
      const judgingAlignment = scoreJudgingAlignment(project, item);
      const rawComposite = clampScore(
        domainAlignment * 0.28 +
          stageAlignment * 0.2 +
          goalAlignment * 0.18 +
          readinessFit * 0.15 +
          accessibilityFit * 0.1 +
          judgingAlignment * 0.09,
        0,
        100
      );

      return {
        ...item,
        requires_demo: requiresDemo === true,
        requires_plan: requiresPlan === true,
        summary: item.summary || summarizeCompetition(item),
        description: item.description || item.notes || describeCompetition(item),
        progression: inferProgression(item),
        match_breakdown: {
          domain_alignment: domainAlignment,
          stage_alignment: stageAlignment,
          goal_alignment: goalAlignment,
          readiness_fit: readinessFit,
          accessibility_fit: accessibilityFit,
          judging_alignment: judgingAlignment,
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
      const rangeNorm = maxRaw === minRaw ? 0.72 : (raw - minRaw) / (maxRaw - minRaw);
      const percentileCalibrated = 68 + rangeNorm * 30;
      const finalScore = clampScore(raw * 0.45 + percentileCalibrated * 0.55, 62, 99);
      return {
        ...item,
        match_score: finalScore,
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
