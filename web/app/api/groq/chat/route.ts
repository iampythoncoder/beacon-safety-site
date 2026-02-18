import { NextResponse } from "next/server";
import { createGroqClient } from "../../../../lib/groq";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: "Missing messages" }, { status: 400 });
    }
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({
        message:
          "AI mentor fallback: focus on customer interviews, one measurable milestone this week, and a clear competition submission timeline."
      });
    }
    const groq = createGroqClient();
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages,
      temperature: 0.4
    });
    const content = completion.choices?.[0]?.message?.content || "";
    return NextResponse.json({ message: content });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to chat" }, { status: 500 });
  }
}
