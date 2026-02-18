import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";
import { isMissingTableError } from "../../../lib/legacyRoadmap";
import { buildFallbackPitches } from "../../../lib/opportunities";

export const runtime = "nodejs";

const fallbackPitches = buildFallbackPitches(180);

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

function keywordFitScore(project: any, item: any) {
  const projectText = `${project?.domain || ""} ${project?.goal || ""}`.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const itemText = `${item?.name || ""} ${item?.type || ""} ${item?.audience || ""} ${item?.relevance_tags || ""}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ");
  const tokens = Array.from(new Set(projectText.split(/\s+/).filter((token) => token && token.length > 2)));
  let score = 0;
  for (const token of tokens) {
    if (itemText.includes(token)) score += 3;
  }
  return Math.min(16, score);
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
      let score = 34;
      if (project?.domain && (matches(item.relevance_tags, project.domain) || matches(item.type, project.domain))) {
        score += 20;
      }
      if (project?.goal && matches(item.relevance_tags, project.goal)) score += 10;
      score += keywordFitScore(project, item);

      if (project?.demo_built) {
        if (requiresDemo === true) score += 8;
        if (requiresDemo === false) score += 4;
      } else {
        if (requiresDemo === true) score -= 3;
        if (requiresDemo === false) score += 6;
      }
      if (requiresPlan === false) score += 8;
      if (requiresPlan === true) score += 2;

      return {
        ...item,
        requires_demo: requiresDemo === true,
        requires_plan: requiresPlan === true,
        summary: item.summary || describePitch(item),
        how_to_apply: item.how_to_apply || "Apply online with a short founder update and deck.",
        match_score: Math.max(10, Math.min(99, score))
      };
    });

    scored.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
    return NextResponse.json(scored);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load pitch opportunities" }, { status: 500 });
  }
}
