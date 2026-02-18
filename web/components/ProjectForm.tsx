import { useState } from "react";
import { ProjectInput } from "../lib/types";

const starterProject: ProjectInput = {
  project_name: "EcoBot",
  project_description: "A robotics project that collects environmental data.",
  domain: "STEM",
  stage: "Prototype",
  team_size: 3,
  skills_available: ["Python", "Robotics", "Arduino"],
  demo_built: true,
  target_user_age_range: [14, 18],
  timeline_available_weeks: 12,
  goal: "Submit to STEM competitions and attract early users",
  additional_notes: "Focus on environmental data collection sensors"
};

export function ProjectForm({
  onSubmit,
  loading,
  error
}: {
  onSubmit: (input: ProjectInput) => void;
  loading: boolean;
  error?: string;
}) {
  const [input, setInput] = useState(JSON.stringify(starterProject, null, 2));

  function handleSubmit() {
    const parsed = JSON.parse(input) as ProjectInput;
    onSubmit(parsed);
  }

  return (
    <div className="card p-6">
      <h2 className="font-display text-xl">Project Intake JSON</h2>
      <p className="text-sm text-black/60 mt-2">
        Paste structured project input. We will auto-generate rating, plan, roadmap, and mentor notes.
      </p>
      <textarea
        className="mt-4 w-full h-72 rounded-2xl border border-black/10 p-4 font-mono text-xs"
        value={input}
        onChange={(event) => setInput(event.target.value)}
      />
      <div className="flex flex-wrap items-center gap-3 mt-4">
        <button
          onClick={handleSubmit}
          className="px-4 py-2 rounded-full bg-ink text-white text-sm"
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Plan"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
