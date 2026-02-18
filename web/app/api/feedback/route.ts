import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabaseServer";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { user_id, message, page } = await req.json();
    if (!message) return NextResponse.json({ error: "Missing message" }, { status: 400 });
    const { error } = await supabaseServer.from("feedback").insert({
      user_id: user_id || null,
      message,
      page: page || "unknown"
    });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to submit feedback" }, { status: 500 });
  }
}
