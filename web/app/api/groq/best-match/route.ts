import { NextResponse } from "next/server";
import { createGroqClient } from "../../../../lib/groq";
import { requireProEntitlement } from "../../../../lib/proEntitlement";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const entitlement = await requireProEntitlement(req);
    if ("error" in entitlement) return entitlement.error;

    const { project, match, type } = await req.json();
    if (!match) return NextResponse.json({ error: "Missing match payload" }, { status: 400 });

    if (!process.env.GROQ_API_KEY) {
      const reason = [
        `Best ${type || "match"} based on your current stage and domain fit.`,
        "Prioritize clear problem proof, early traction signals, and a concise execution plan.",
        "Use your roadmap milestones as evidence in the application."
      ].join(" ");
      return NextResponse.json({ reasoning: reason });
    }

    const groq = createGroqClient();
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are a startup mentor. Return a 2-3 sentence explanation." },
        {
          role: "user",
          content: JSON.stringify({
            task: "Explain why this is the best match and what to emphasize in the application.",
            type,
            project: project || {},
            match
          })
        }
      ],
      temperature: 0.2
    });
    const content = completion.choices?.[0]?.message?.content || "";
    return NextResponse.json({ reasoning: content });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to generate reasoning" }, { status: 500 });
  }
}
