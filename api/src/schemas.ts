import { z } from "zod";

export const ProjectInputSchema = z.object({
  user_id: z.string().uuid().optional(),
  onboarding: z
    .object({
      ideaStage: z.string().optional(),
      domains: z.array(z.string()).optional(),
      primaryGoal: z.string().optional(),
      experience: z.string().optional(),
      timeline: z.string().optional(),
      ideaSentence: z.string().optional()
    })
    .optional(),
  project_name: z.string().min(2),
  project_description: z.string().min(10),
  domain: z.string().min(2),
  stage: z.string().min(2),
  team_size: z.number().int().min(1),
  skills_available: z.array(z.string()).default([]),
  demo_built: z.boolean(),
  target_user_age_range: z.union([z.string(), z.array(z.number().int())]),
  timeline_available_weeks: z.number().int().min(1),
  goal: z.string().min(2),
  additional_notes: z.string().optional().default("")
});

export const ProgressUpdateSchema = z.object({
  project_id: z.string().min(1),
  stage_id: z.string().min(1),
  task_id: z.string().min(1),
  completed: z.boolean()
});

export const IdeaRatingSchema = z.object({
  scope: z.number().min(0).max(100),
  complexity: z.number().min(0).max(100),
  market_fit: z.number().min(0).max(100),
  competition_density: z.number().min(0).max(100),
  feasibility: z.number().min(0).max(100),
  notes: z.string().optional()
});

export const LeanPlanSchema = z.object({
  problem_statement: z.string(),
  solution_summary: z.string(),
  target_user: z.string(),
  key_features: z.array(z.string()),
  success_metrics: z.array(z.string()),
  monetization_strategy: z.string()
});

export const RoadmapTaskSchema = z.object({
  task_id: z.string(),
  task: z.string()
});

export const RoadmapWeekSchema = z.object({
  week: z.number().int().min(1),
  tasks: z.array(RoadmapTaskSchema),
  deliverables: z.array(z.string()),
  tools: z.array(z.string()),
  tips: z.string().optional(),
  pitfalls: z.array(z.string()).optional()
});

export const RoadmapStageSchema = z.object({
  stage_id: z.string(),
  stage_name: z.string(),
  weeks: z.array(RoadmapWeekSchema)
});

export const MentorNotesSchema = z.object({
  summary: z.string(),
  next_steps: z.array(z.string()),
  pitfalls: z.array(z.string()),
  faq: z.array(z.object({ question: z.string(), answer: z.string() }))
});

export const AIResponseSchema = z.object({
  idea_rating: IdeaRatingSchema,
  lean_business_plan: LeanPlanSchema,
  roadmap: z.array(RoadmapStageSchema),
  mentor_notes: MentorNotesSchema,
  summary: z.string()
});

export type ProjectInput = z.infer<typeof ProjectInputSchema>;
export type AIResponse = z.infer<typeof AIResponseSchema>;
