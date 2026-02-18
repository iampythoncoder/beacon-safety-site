import Groq from "groq-sdk";
import { AIResponseSchema, ProjectInput } from "./schemas.js";

const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

export function createGroqClient() {
  const apiKey = process.env.GROQ_API_KEY || "";
  return new Groq({ apiKey });
}

export async function generateAnalysis(groq: Groq, input: ProjectInput) {
  const system = "You are a startup mentor for high school founders. Return strict JSON only.";
  const user = {
    task: "Generate idea rating, lean plan, roadmap, mentor notes, and summary.",
    output_contract: {
      idea_rating: "numbers 0-100",
      roadmap: "10-12 sequential stages, 3-7 tasks/week, include tools, deliverables, tips, pitfalls",
      mentor_notes: "structured JSON with summary, next_steps, pitfalls, faq",
      summary: "PDF-ready text"
    },
    constraints: {
      stages: [
        "Ideation & Validation",
        "Prototype / MVP Build",
        "Website / App Build",
        "Business Plan Finalization",
        "Apply to Accelerators",
        "Pitch Deck Creation",
        "Competition Submissions",
        "Marketing / Early Users",
        "Launch & Iteration",
        "Post-Launch Growth"
      ],
      tools: ["Bolt", "Lovable", "Bubble", "Webflow", "Firebase", "Notion"],
      roadmap_schema: {
        stage_id: "kebab-case",
        stage_name: "string",
        weeks: [
          {
            week: "number",
            tasks: [{ task_id: "kebab-case", task: "string" }],
            deliverables: ["string"],
            tools: ["string"],
            tips: "string",
            pitfalls: ["string"]
          }
        ]
      }
    },
    input
  };

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: JSON.stringify(user) }
    ],
    temperature: 0.3,
    response_format: { type: "json_object" }
  });

  const content = completion.choices?.[0]?.message?.content || "{}";
  const parsed = JSON.parse(content);
  return AIResponseSchema.parse(parsed);
}

export async function generateMatchExplanations(
  groq: Groq,
  payload: {
    input: ProjectInput;
    type: "competition" | "pitch";
    matches: Array<{ id: string; name: string; stage_fit?: string; domain_focus?: string; requires_demo?: boolean; requires_plan?: boolean }>
  }
) {
  const system = "Return JSON only. Provide concise explanation for each match id in {explanations:{id:text}}.";
  const user = {
    task: "Explain why each match fits",
    input: payload.input,
    type: payload.type,
    matches: payload.matches
  };

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: JSON.stringify(user) }
    ],
    temperature: 0.2,
    response_format: { type: "json_object" }
  });

  const content = completion.choices?.[0]?.message?.content || "{}";
  const parsed = JSON.parse(content);
  return parsed.explanations || {};
}
