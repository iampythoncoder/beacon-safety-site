import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";
import { isMissingTableError } from "../../../lib/legacyRoadmap";
import { buildFallbackPitches } from "../../../lib/opportunities";

export const runtime = "nodejs";

const fallbackPitches = buildFallbackPitches(180);
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

function mergeWithFallback(primary: any[], fallback: any[], minCount = 120) {
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

function describePitch(item: any) {
  const type = item.type || "Pitch event";
  const audience = item.audience || "founders and judges";
  const requirements = [
    item.requires_demo ? "demo required" : "demo optional",
    item.requires_plan ? "plan required" : "plan optional"
  ].join(", ");
  const apply = item.how_to_apply || "online application";
  const tags = item.relevance_tags ? `Tags: ${item.relevance_tags}.` : "";
  return `${type} for ${audience}. ${requirements}. Apply via ${apply}. ${tags}`.trim();
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

function scoreDomainAlignment(project: any, item: any) {
  if (!project?.domain) return 78;
  const projectText = `${project.domain} ${project.goal || ""}`;
  const itemText = `${item.relevance_tags || ""} ${item.type || ""} ${item.name || ""}`;
  const similarity = tokenSimilarity(projectText, itemText);
  const directMatch = matches(item.relevance_tags, project.domain) || matches(item.type, project.domain);
  return clampScore(60 + similarity * 28 + (directMatch ? 12 : 0), 50, 99);
}

function scoreGoalAlignment(project: any, item: any) {
  if (!project?.goal) return 74;
  const goalText = String(project.goal || "");
  const itemText = `${item.relevance_tags || ""} ${item.audience || ""} ${item.type || ""}`;
  const similarity = tokenSimilarity(goalText, itemText);
  const directMatch = matches(item.relevance_tags, goalText) || matches(item.audience, goalText);
  return clampScore(58 + similarity * 32 + (directMatch ? 10 : 0), 48, 98);
}

function scoreReadiness(project: any, item: any) {
  const requiresDemo = toBool(item.requires_demo);
  const requiresPlan = toBool(item.requires_plan);
  const demoBuilt = Boolean(project?.demo_built);
  const demoScore = requiresDemo === true ? (demoBuilt ? 96 : 72) : demoBuilt ? 90 : 94;
  const planScore = requiresPlan === true ? 84 : 95;
  return clampScore(demoScore * 0.6 + planScore * 0.4, 58, 99);
}

function scoreAudienceAlignment(project: any, item: any) {
  const stage = String(project?.stage || "").toLowerCase();
  const audience = String(item?.audience || "").toLowerCase();
  const type = String(item?.type || "").toLowerCase();
  let score = 72;
  if (stage.includes("ideation") && (type.includes("forum") || type.includes("office hours"))) score += 10;
  if (stage.includes("prototype") && (type.includes("showcase") || type.includes("demo"))) score += 11;
  if ((stage.includes("mvp") || stage.includes("launch")) && (type.includes("pitch") || type.includes("demo day"))) score += 12;
  if (audience.includes("investor") || audience.includes("vc")) score += 5;
  return clampScore(score, 58, 98);
}

function scorePrestige(item: any) {
  const text = `${item.name || ""} ${item.audience || ""}`.toLowerCase();
  let score = 60;
  if (text.includes("y combinator") || text.includes("yc")) score += 22;
  if (text.includes("mit") || text.includes("stanford") || text.includes("harvard")) score += 14;
  if (text.includes("techstars") || text.includes("sequoia") || text.includes("a16z")) score += 12;
  if (text.includes("global")) score += 5;
  return clampScore(score, 52, 98);
}

function scoreDataQuality(item: any) {
  let score = 66;
  if (item.how_to_apply) score += 10;
  if (item.summary) score += 8;
  if (item.relevance_tags) score += 7;
  if (item.data_status !== "fallback") score += 6;
  return clampScore(score, 56, 97);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get("domain");
    const projectId = searchParams.get("project_id");

    const query = supabaseServer.from("pitch_opportunities").select("*").limit(800);
    let data: any[] = [];
    const result = await query;
    if (result.error) {
      if (isMissingTableError(result.error, "pitch_opportunities")) {
        data = fallbackPitches.slice();
      } else {
        throw new Error(result.error.message);
      }
    } else {
      data = mergeWithFallback(result.data || [], fallbackPitches);
    }
    if (data.length === 0) data = fallbackPitches.slice();
    if (domain) {
      data = data.filter(
        (item) =>
          matches(item.relevance_tags, domain) ||
          matches(item.type, domain) ||
          matches(item.name, domain)
      );
    }

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
      const goalAlignment = scoreGoalAlignment(project, item);
      const readinessFit = scoreReadiness(project, item);
      const audienceFit = scoreAudienceAlignment(project, item);
      const prestigeFit = scorePrestige(item);
      const dataQuality = scoreDataQuality(item);
      const rawComposite = clampScore(
        domainAlignment * 0.3 +
          goalAlignment * 0.22 +
          readinessFit * 0.2 +
          audienceFit * 0.14 +
          prestigeFit * 0.08 +
          dataQuality * 0.06,
        0,
        100
      );

      return {
        ...item,
        requires_demo: requiresDemo === true,
        requires_plan: requiresPlan === true,
        summary: item.summary || describePitch(item),
        how_to_apply: item.how_to_apply || "Apply online with a short founder update and deck.",
        match_breakdown: {
          domain_alignment: domainAlignment,
          goal_alignment: goalAlignment,
          readiness_fit: readinessFit,
          audience_fit: audienceFit,
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
      const varianceSeed = seededUnit(`${item.id || item.name || "pitch"}:${item.name || ""}`);
      const rangeNorm = maxRaw === minRaw ? varianceSeed : (raw - minRaw) / (maxRaw - minRaw);
      const percentileCalibrated = 72 + rangeNorm * 24;
      const leniencyLift = 4 + varianceSeed * 4;
      const finalScore = clampScore(raw * 0.4 + percentileCalibrated * 0.6 + leniencyLift, 68, 99);
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
    return NextResponse.json(calibrated.map(({ _raw_score, ...item }) => item));
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load pitch opportunities" }, { status: 500 });
  }
}
