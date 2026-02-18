"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

type Log = { id: string; entry: string; results?: string; created_at: string };

type Stage = {
  id: string;
  stage_name: string;
  tasks: Array<{ id: string; task_id: string; task: string; completed: boolean }>;
};

export default function ProgressPage() {
  const [projectId, setProjectId] = useState<string>("");
  const [entry, setEntry] = useState("");
  const [links, setLinks] = useState("");
  const [results, setResults] = useState("");
  const [logs, setLogs] = useState<Log[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    async function load() {
      const session = await supabase.auth.getSession();
      const userId = session.data.session?.user?.id;
      if (!userId) return;
      const projectRes = await fetch(`/api/projects/latest?user_id=${userId}`);
      if (!projectRes.ok) return;
      const project = await projectRes.json();
      if (!project?.id) return;
      setProjectId(project.id);

      const logRes = await fetch(`/api/progress/logs?project_id=${project.id}`);
      if (logRes.ok) setLogs(await logRes.json());

      const roadmapRes = await fetch(`/api/roadmap?project_id=${project.id}`);
      if (roadmapRes.ok) setStages(await roadmapRes.json());
    }
    load();
  }, []);

  async function submit() {
    if (!projectId || !entry.trim()) return;
    setStatus("");
    const session = await supabase.auth.getSession();
    const userId = session.data.session?.user?.id;
    const res = await fetch("/api/progress/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, user_id: userId, entry, links, results })
    });
    if (res.ok) {
      setEntry("");
      setLinks("");
      setResults("");
      setStatus("Logged.");
      const logRes = await fetch(`/api/progress/logs?project_id=${projectId}`);
      if (logRes.ok) setLogs(await logRes.json());
    } else {
      setStatus("Failed to log progress.");
    }
  }

  async function toggleTask(stageRowId: string, taskId: string, completed: boolean) {
    await fetch("/api/progress/completeTask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage_row_id: stageRowId, task_id: taskId, completed, project_id: projectId })
    });
    const roadmapRes = await fetch(`/api/roadmap?project_id=${projectId}`);
    if (roadmapRes.ok) setStages(await roadmapRes.json());
  }

  return (
    <div className="os-page space-y-6">
      <section className="card p-8">
        <p className="text-xs uppercase tracking-[0.32em] text-black/45">Progress Tracking</p>
        <h2 className="mt-3 text-4xl font-semibold tracking-tight">Log execution and unlock next actions</h2>
        <p className="mt-3 text-black/65 max-w-2xl">
          Each update helps recalibrate your roadmap and keeps mentor guidance aligned with what you shipped.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="card p-6 space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-black/40">Log update</p>
          <textarea
            className="w-full rounded-2xl border border-black/10 bg-white/82 px-4 py-3 text-sm"
            rows={4}
            placeholder="What did you complete this week?"
            value={entry}
            onChange={(event) => setEntry(event.target.value)}
          />
          <input
            className="w-full rounded-2xl border border-black/10 bg-white/82 px-4 py-3 text-sm"
            placeholder="Links (optional)"
            value={links}
            onChange={(event) => setLinks(event.target.value)}
          />
          <input
            className="w-full rounded-2xl border border-black/10 bg-white/82 px-4 py-3 text-sm"
            placeholder="Results (optional)"
            value={results}
            onChange={(event) => setResults(event.target.value)}
          />
          <div className="flex items-center gap-3">
            <button className="px-5 py-2.5 rounded-full bg-ink text-white text-sm" onClick={submit}>
              Log update
            </button>
            {status && <p className="text-xs text-black/55">{status}</p>}
          </div>
        </div>

        <div className="card p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-black/40">Recent updates</p>
          <div className="mt-3 space-y-2 max-h-[320px] overflow-auto">
            {logs.length === 0 ? (
              <p className="text-sm text-black/60">No progress logs yet.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-black/10 bg-white/82 p-3">
                  <p className="text-sm text-black/78">{log.entry}</p>
                  {log.results && <p className="mt-1 text-xs text-black/62">Result: {log.results}</p>}
                  <p className="mt-1 text-xs text-black/48">{new Date(log.created_at).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="card p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-black/40">Task completion</p>
        <div className="mt-4 grid gap-4">
          {stages.map((stage) => (
            <div key={stage.id} className="rounded-2xl border border-black/10 bg-white/82 p-4">
              <p className="text-sm font-semibold">{stage.stage_name}</p>
              <div className="mt-3 grid gap-2">
                {stage.tasks.map((task) => (
                  <label key={task.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={(event) => toggleTask(stage.id, task.task_id, event.target.checked)}
                    />
                    <span className={task.completed ? "line-through text-black/45" : "text-black/75"}>{task.task}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
