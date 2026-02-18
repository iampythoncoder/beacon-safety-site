type IdeaAspectFeedback = {
  aspect: string;
  score: number;
  strength: string;
  risk: string;
  next_action: string;
};

export function IdeaAspectFeedbackPanel({
  items,
  compact = false
}: {
  items: IdeaAspectFeedback[];
  compact?: boolean;
}) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-black/60">No aspect feedback yet. Generate your plan to unlock this.</p>;
  }

  return (
    <div className={`grid gap-3 ${compact ? "md:grid-cols-2" : "lg:grid-cols-2"}`}>
      {items.map((item) => (
        <article key={item.aspect} className="rounded-2xl border border-black/10 bg-white/82 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">{item.aspect}</p>
            <span className="text-xs uppercase tracking-[0.2em] text-black/55">{Math.round(item.score)}/100</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-black/10 overflow-hidden">
            <span className="block h-full bg-black" style={{ width: `${Math.max(0, Math.min(100, item.score))}%` }} />
          </div>
          <p className="mt-3 text-xs text-black/68">
            <span className="font-semibold text-black/78">Strength:</span> {item.strength}
          </p>
          <p className="mt-1 text-xs text-black/68">
            <span className="font-semibold text-black/78">Risk:</span> {item.risk}
          </p>
          <p className="mt-1 text-xs text-black/68">
            <span className="font-semibold text-black/78">Next action:</span> {item.next_action}
          </p>
        </article>
      ))}
    </div>
  );
}
