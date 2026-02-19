export type ProjectInput = {
  user_id?: string;
  onboarding?: {
    ideaStage: string;
    domains: string[];
    primaryGoal: string;
    experience: string;
    timeline: string;
    ideaSentence: string;
  };
  project_name: string;
  project_description: string;
  domain: string;
  stage: string;
  team_size: number;
  skills_available: string[];
  demo_built: boolean;
  target_user_age_range: string | number[];
  timeline_available_weeks: number;
  goal: string;
  additional_notes?: string;
};

export type IdeaRating = {
  scope: number;
  complexity: number;
  market_fit: number;
  competition_density: number;
  feasibility: number;
  notes?: string;
};

export type IdeaRatingDetails = {
  [key in keyof Omit<IdeaRating, "notes">]?: {
    reason?: string;
    improve_with?: string;
  } | string;
};

export type IdeaAspectFeedback = Array<{
  aspect: string;
  score: number;
  strength: string;
  risk: string;
  next_action: string;
}>;

export type RoadmapTask = { task_id: string; task: string };
export type RoadmapWeek = {
  week: number;
  tasks: RoadmapTask[];
  deliverables: string[];
  tools: string[];
  tips?: string;
  pitfalls?: string[];
};
export type RoadmapStage = { stage_id: string; stage_name: string; weeks: RoadmapWeek[] };

export type MentorNotes = {
  summary: string;
  next_steps: string[];
  pitfalls: string[];
  faq: { question: string; answer: string }[];
};

export type Competition = {
  id: string;
  name: string;
  category?: string;
  domain_focus?: string;
  stage_fit?: string;
  eligibility_age_min?: number;
  eligibility_age_max?: number;
  team_size_max?: number;
  requires_demo?: boolean;
  requires_plan?: boolean;
  judging_focus?: string;
  deadline?: string;
  application_link?: string;
  location?: string;
  data_status?: string;
  relevance_score?: number;
  explanation?: string;
  progression?: string[];
};

export type PitchOpportunity = {
  id: string;
  name: string;
  type?: string;
  audience?: string;
  requires_demo?: boolean;
  requires_plan?: boolean;
  how_to_apply?: string;
  eligibility_age_min?: number;
  eligibility_age_max?: number;
  team_size_max?: number;
  relevance_tags?: string;
  data_status?: string;
  relevance_score?: number;
  explanation?: string;
};

export type ProjectResponse = {
  project_id: string;
  project_input: ProjectInput;
  idea_rating: IdeaRating;
  lean_business_plan: Record<string, unknown>;
  roadmap: RoadmapStage[];
  mentor_notes: MentorNotes;
  summary: string;
  competition_matches: Competition[];
  pitch_matches: PitchOpportunity[];
  progress: { stages: Array<{ stage_id: string; tasks: Array<{ task_id: string; completed: boolean }>; completed?: boolean }> };
};
