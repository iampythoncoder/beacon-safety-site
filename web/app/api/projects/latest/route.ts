import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";

export const runtime = "nodejs";

function isMissingTableError(error: any, table: string) {
  const message = String(error?.message || "");
  return (
    error?.code === "PGRST205" ||
    message.includes(`public.${table}`) ||
    message.includes(`relation "${table}" does not exist`) ||
    message.includes("schema cache")
  );
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("user_id");
  if (!userId) return NextResponse.json({ error: "Missing user_id" }, { status: 400 });

  const { data, error } = await supabaseServer
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const projectsMissing = Boolean(error && isMissingTableError(error, "projects"));
  if (error && !projectsMissing) return NextResponse.json({ error: error.message }, { status: 500 });
  if (data) return NextResponse.json(data);

  // Backfill path: older flows stored data in user_projects only.
  const { data: legacy, error: legacyError } = await supabaseServer
    .from("user_projects")
    .select("id, project_input, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (legacyError) return NextResponse.json({ error: legacyError.message }, { status: 500 });
  if (!legacy?.project_input || typeof legacy.project_input !== "object") {
    return NextResponse.json(null);
  }

  const input = legacy.project_input as Record<string, any>;
  const fallbackName =
    input.project_name ||
    input.name ||
    (typeof input.idea_sentence === "string" && input.idea_sentence.trim()
      ? input.idea_sentence.trim().slice(0, 40)
      : "Untitled Startup");

  const targetAge = Array.isArray(input.target_user_age_range)
    ? input.target_user_age_range.join("-")
    : input.target_user_age_range || "14-18";

  if (!projectsMissing) {
    const { data: inserted, error: insertError } = await supabaseServer
      .from("projects")
      .insert({
        user_id: userId,
        name: fallbackName,
        description: input.project_description || input.description || "Student startup project",
        domain: input.domain || "General",
        stage: input.stage || "Ideation",
        team_size: Number(input.team_size) || 1,
        demo_built: Boolean(input.demo_built),
        target_user_age_range: targetAge,
        timeline_available_weeks: Number(input.timeline_available_weeks) || 8,
        goal: input.goal || "Build a real product"
      })
      .select("*")
      .single();

    if (!insertError && inserted) return NextResponse.json(inserted);
  }

  // Legacy fallback shape for clients expecting a project object.
  return NextResponse.json({
    id: legacy.id,
    user_id: userId,
    name: fallbackName,
    description: input.project_description || input.description || "Student startup project",
    domain: input.domain || "General",
    stage: input.stage || "Ideation",
    team_size: Number(input.team_size) || 1,
    demo_built: Boolean(input.demo_built),
    target_user_age_range: targetAge,
    timeline_available_weeks: Number(input.timeline_available_weeks) || 8,
    goal: input.goal || "Build a real product",
    created_at: legacy.created_at
  });
}
