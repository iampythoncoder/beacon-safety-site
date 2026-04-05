import { NextResponse } from "next/server";
import { appendValidationEvent, getValidationState } from "../../../lib/validationTracker";

export const runtime = "nodejs";

function sanitizeQuestions(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((question) => String(question || "").trim())
    .filter(Boolean)
    .slice(0, 20);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("project_id");
    if (!projectId) {
      return NextResponse.json({ error: "Missing project_id" }, { status: 400 });
    }

    const state = await getValidationState(projectId);
    return NextResponse.json(state);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to load validation data" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const projectId = String(body?.project_id || "").trim();
    const userId = String(body?.user_id || "").trim();
    const action = String(body?.action || "").trim();
    const links = String(body?.links || "").trim();
    const data = body?.data && typeof body.data === "object" ? body.data : {};

    if (!projectId || !action) {
      return NextResponse.json({ error: "Missing project_id or action" }, { status: 400 });
    }

    if (action === "interview") {
      const interviewee = String(data.interviewee || "").trim();
      const segment = String(data.segment || "").trim();
      const pain_point = String(data.pain_point || "").trim();
      const urgency = Number(data.urgency || 0);
      const count = Number(data.count || 1);
      const results = String(data.results || "").trim();

      await appendValidationEvent({
        project_id: projectId,
        user_id: userId || null,
        links,
        entry: `[Validation] Interview logged${interviewee ? `: ${interviewee}` : ""}`,
        metadata: {
          validation_type: "interview",
          interviewee,
          segment,
          pain_point,
          urgency: Number.isFinite(urgency) ? Math.max(1, Math.min(5, Math.round(urgency))) : null,
          count: Number.isFinite(count) && count > 0 ? Math.round(count) : 1,
          results
        }
      });
    } else if (action === "survey") {
      const title = String(data.title || "").trim();
      const target_segment = String(data.target_segment || "").trim();
      const response_goal = Number(data.response_goal || 0);
      const questions = sanitizeQuestions(data.questions);

      if (!title || questions.length === 0) {
        return NextResponse.json({ error: "Survey title and at least one question are required." }, { status: 400 });
      }

      await appendValidationEvent({
        project_id: projectId,
        user_id: userId || null,
        links,
        entry: `[Validation] Survey created${title ? `: ${title}` : ""}`,
        metadata: {
          validation_type: "survey",
          title,
          target_segment,
          response_goal: Number.isFinite(response_goal) ? Math.max(0, Math.round(response_goal)) : 0,
          questions
        }
      });
    } else if (action === "waitlist") {
      const waitlist_count = Number(data.waitlist_count || 0);
      const source = String(data.source || "").trim();
      const notes = String(data.notes || "").trim();
      if (!Number.isFinite(waitlist_count) || waitlist_count < 0) {
        return NextResponse.json({ error: "waitlist_count must be a non-negative number." }, { status: 400 });
      }

      await appendValidationEvent({
        project_id: projectId,
        user_id: userId || null,
        links,
        entry: `[Validation] Waitlist update: ${Math.round(waitlist_count)}`,
        metadata: {
          validation_type: "waitlist",
          waitlist_count: Math.round(waitlist_count),
          source,
          notes
        }
      });
    } else {
      return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
    }

    const state = await getValidationState(projectId);
    return NextResponse.json(state);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save validation event" }, { status: 500 });
  }
}
