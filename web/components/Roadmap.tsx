import { RoadmapStage } from "../lib/types";

export function Roadmap({
  roadmap,
  progress,
  onToggleTask
}: {
  roadmap: RoadmapStage[];
  progress: Record<string, { tasks: Record<string, boolean>; completed: boolean }>;
  onToggleTask: (stageId: string, taskId: string, next: boolean) => void;
}) {
  return (
    <div className="roadmap-shell">
      <div className="roadmap-header">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-black/40">Execution map</p>
          <h2 className="font-display text-2xl mt-2">Stage-by-Stage Roadmap</h2>
          <p className="text-sm text-black/60 mt-2">Every stage unlocks the next with clear tasks, tools, and proof.</p>
        </div>
        <span className="roadmap-pill">Progress-locked</span>
      </div>
      <div className="roadmap-stages">
        {roadmap.map((stage, index) => {
          const previousStage = roadmap[index - 1];
          const previousCompleted = previousStage ? progress[previousStage.stage_id]?.completed : true;
          const unlocked = previousCompleted;
          const stageProgress = progress[stage.stage_id];

          return (
            <div key={stage.stage_id} className={`roadmap-stage ${unlocked ? "is-unlocked" : "is-locked"}`}>
              <div className="roadmap-stage-header">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-black/40">Stage {index + 1}</p>
                  <h3 className="font-display text-lg mt-1">{stage.stage_name}</h3>
                </div>
                <span className={`roadmap-status ${unlocked ? "is-unlocked" : "is-locked"}`}>
                  {unlocked ? "Unlocked" : "Locked"}
                </span>
              </div>
              <div className="roadmap-weeks">
                {stage.weeks.map((week) => (
                  <div key={`${stage.stage_id}-${week.week}`} className="roadmap-week">
                    <div className="roadmap-week-header">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-black/40">Week {week.week}</p>
                        <p className="text-sm font-semibold mt-1">Execution sprint</p>
                      </div>
                      <span className="roadmap-week-pill">{week.tasks.length} tasks</span>
                    </div>
                    <ul className="roadmap-task-list">
                      {week.tasks.map((task) => {
                        const isDone = stageProgress?.tasks?.[task.task_id] || false;
                        return (
                          <li key={task.task_id} className="roadmap-task">
                            <input
                              type="checkbox"
                              disabled={!unlocked}
                              checked={isDone}
                              onChange={() => onToggleTask(stage.stage_id, task.task_id, !isDone)}
                              className="roadmap-check"
                            />
                            <span className={isDone ? "line-through text-black/40" : "text-black/70"}>{task.task}</span>
                          </li>
                        );
                      })}
                    </ul>
                    <div className="roadmap-meta">
                      {week.tools.map((tool) => (
                        <span key={tool} className="badge bg-ink text-white">{tool}</span>
                      ))}
                    </div>
                    <div className="roadmap-notes">
                      {week.tips && <p className="text-xs text-black/60">Tip: {week.tips}</p>}
                      {week.pitfalls && week.pitfalls.length > 0 && (
                        <p className="text-xs text-black/60">Pitfalls: {week.pitfalls.join(", ")}</p>
                      )}
                      {week.deliverables.length > 0 && (
                        <p className="text-xs text-black/50">Deliverables: {week.deliverables.join(", ")}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
