import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../lib/supabaseServer";
import { isMissingTableError } from "../../../../lib/legacyRoadmap";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { project_id, user_id, plan } = await req.json();
    if (!project_id || !plan) return NextResponse.json({ error: "Missing payload" }, { status: 400 });

    const { data: latest } = await supabaseServer
      .from("business_plans")
      .select("version")
      .eq("project_id", project_id)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nextVersion = latest?.version ? latest.version + 1 : 1;

    const { error } = await supabaseServer.from("business_plans").insert({
      project_id,
      version: nextVersion,
      plan
    });
    if (error && !isMissingTableError(error, "business_plans")) throw new Error(error.message);
    if (!error) return NextResponse.json({ ok: true, version: nextVersion });

    // Legacy fallback
    const { data: updatedById, error: legacyError } = await supabaseServer
      .from("user_projects")
      .update({
        idea_rating: plan.idea_rating || {},
        lean_business_plan: plan.business_plan || plan.lean_business_plan || {},
        mentor_notes: plan.mentor_summary || plan.mentor_notes || {},
        summary: plan.idea_feedback || plan.summary || ""
      })
      .eq("id", project_id)
      .select("id");
    if (legacyError) throw new Error(legacyError.message);

    if (!updatedById || updatedById.length === 0) {
      const { error: legacyAltError } = await supabaseServer
        .from("user_projects")
        .update({
          idea_rating: plan.idea_rating || {},
          lean_business_plan: plan.business_plan || plan.lean_business_plan || {},
          mentor_notes: plan.mentor_summary || plan.mentor_notes || {},
          summary: plan.idea_feedback || plan.summary || ""
        })
        .filter("project_input->>generated_project_id", "eq", project_id);
      if (legacyAltError) throw new Error(legacyAltError.message);
    }

    if (user_id) {
      await supabaseServer
        .from("user_projects")
        .update({
          idea_rating: plan.idea_rating || {},
          lean_business_plan: plan.business_plan || plan.lean_business_plan || {},
          mentor_notes: plan.mentor_summary || plan.mentor_notes || {},
          summary: plan.idea_feedback || plan.summary || ""
        })
        .eq("user_id", user_id);
    }

    return NextResponse.json({ ok: true, version: 1 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save" }, { status: 500 });
  }
}
