create table if not exists competitions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  domain_focus text,
  stage_fit text,
  eligibility_age_min int,
  eligibility_age_max int,
  team_size_max int,
  requires_demo boolean default false,
  requires_plan boolean default false,
  judging_focus text,
  deadline date,
  application_link text,
  location text,
  notes text,
  data_status text not null default 'not available',
  created_at timestamptz default now()
);

create table if not exists pitch_opportunities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text,
  audience text,
  requires_demo boolean default false,
  requires_plan boolean default false,
  how_to_apply text,
  eligibility_age_min int,
  eligibility_age_max int,
  team_size_max int,
  relevance_tags text,
  data_status text not null default 'not available',
  created_at timestamptz default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  description text not null,
  domain text not null,
  stage text not null,
  team_size integer not null,
  demo_built boolean default false,
  target_user_age_range text,
  timeline_available_weeks integer,
  goal text,
  created_at timestamptz default now()
);

create table if not exists onboarding_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  project_id uuid references projects(id) on delete cascade,
  idea_stage text,
  domains text[],
  primary_goal text,
  experience text,
  timeline text,
  idea_sentence text,
  created_at timestamptz default now()
);

create table if not exists business_plans (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  version integer not null,
  plan jsonb not null,
  created_at timestamptz default now()
);

create table if not exists roadmap_stages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  stage_id text not null,
  stage_name text not null,
  position integer not null,
  unlocked boolean default false,
  created_at timestamptz default now()
);

create table if not exists roadmap_tasks (
  id uuid primary key default gen_random_uuid(),
  stage_row_id uuid references roadmap_stages(id) on delete cascade,
  task_id text not null,
  task text not null,
  week integer,
  position integer,
  tools text,
  deliverables text,
  completed boolean default false,
  created_at timestamptz default now()
);

create table if not exists progress_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  user_id uuid not null,
  entry text not null,
  links text,
  results text,
  created_at timestamptz default now()
);

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  page text,
  message text not null,
  created_at timestamptz default now()
);

create table if not exists user_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  project_input jsonb not null,
  idea_rating jsonb,
  lean_business_plan jsonb,
  roadmap jsonb,
  mentor_notes jsonb,
  summary text,
  competition_matches jsonb,
  pitch_matches jsonb,
  progress jsonb,
  created_at timestamptz default now()
);

create table if not exists users (
  user_id uuid primary key,
  has_completed_onboarding boolean default false,
  created_at timestamptz default now()
);

create table if not exists startup_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(user_id) on delete cascade,
  idea_stage text,
  domains text,
  primary_goal text,
  experience text,
  timeline text,
  idea_sentence text,
  created_at timestamptz default now()
);

create table if not exists progress_tracking (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  project_id uuid references user_projects(id) on delete cascade,
  stage_name text,
  task_name text,
  completed boolean default false,
  unlocked boolean default false,
  created_at timestamptz default now()
);

create index if not exists competitions_domain_idx on competitions using gin (to_tsvector('english', domain_focus));
create index if not exists competitions_stage_idx on competitions using gin (to_tsvector('english', stage_fit));
create index if not exists pitch_tags_idx on pitch_opportunities using gin (to_tsvector('english', relevance_tags));
