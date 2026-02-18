import { ProjectInput, ProjectResponse } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

export async function createProject(input: ProjectInput): Promise<ProjectResponse> {
  const res = await fetch(`${API_BASE}/project`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!res.ok) throw new Error("Failed to create project");
  return res.json();
}

export async function updateProgress(payload: {
  project_id: string;
  stage_id: string;
  task_id: string;
  completed: boolean;
}) {
  const res = await fetch(`${API_BASE}/progress`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to update progress");
  return res.json();
}

export async function fetchSummary(projectId: string) {
  const res = await fetch(`${API_BASE}/project/${projectId}/summary`);
  if (!res.ok) throw new Error("Failed to fetch summary");
  return res.json();
}

export async function fetchLatestProject(userId: string) {
  const res = await fetch(`${API_BASE}/project/user/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch project");
  return res.json();
}

export async function fetchOnboardingStatus(userId: string) {
  const res = await fetch(`${API_BASE}/user/${userId}/onboarding-status`);
  if (!res.ok) throw new Error("Failed to fetch onboarding status");
  return res.json();
}

export async function submitOnboarding(payload: any) {
  const res = await fetch(`${API_BASE}/onboarding`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to submit onboarding");
  return res.json();
}
