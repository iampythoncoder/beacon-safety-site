import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { isMissingTableError } from "../../../../lib/legacyRoadmap";

export const runtime = "nodejs";

function toDomains(value: unknown) {
  if (Array.isArray(value)) return value.filter((item) => typeof item === "string");
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("project_id");
    let userId = searchParams.get("user_id");

    if (!projectId && !userId) {
      return NextResponse.json({ error: "Missing project_id or user_id" }, { status: 400 });
    }

    if (!userId && projectId) {
      const { data: project } = await supabaseServer.from("projects").select("user_id").eq("id", projectId).maybeSingle();
      userId = project?.user_id || null;
    }

    if (projectId) {
      const { data, error } = await supabaseServer
        .from("onboarding_answers")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error && !isMissingTableError(error, "onboarding_answers")) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      if (data) return NextResponse.json(data);
    }

    if (userId) {
      const { data, error } = await supabaseServer
        .from("onboarding_answers")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error && !isMissingTableError(error, "onboarding_answers")) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      if (data) return NextResponse.json(data);
    }

    if (!userId) return NextResponse.json(null);

    const { data: profile, error: profileError } = await supabaseServer
      .from("startup_profile")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (profileError && !isMissingTableError(profileError, "startup_profile")) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }
    if (!profile) return NextResponse.json(null);

    return NextResponse.json({
      user_id: userId,
      project_id: projectId,
      idea_stage: profile.idea_stage || "",
      domains: toDomains(profile.domains),
      primary_goal: profile.primary_goal || "",
      experience: profile.experience || "",
      timeline: profile.timeline || "",
      idea_sentence: profile.idea_sentence || ""
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load onboarding answers" }, { status: 500 });
  }
}
