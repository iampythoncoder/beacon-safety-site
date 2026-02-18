import clsx from "clsx";
import { IdeaRating } from "../lib/types";

type MetricDetail = {
  reason?: string;
  improve_with?: string;
};

type IdeaRatingPanelProps = {
  ideaRating: IdeaRating | Record<string, any>;
  details?: Record<string, string | MetricDetail>;
  className?: string;
  showHeader?: boolean;
};

const rows = [
  { key: "scope", label: "Scope" },
  { key: "complexity", label: "Complexity" },
  { key: "market_fit", label: "Market Fit" },
  { key: "feasibility", label: "Feasibility" },
  { key: "competition_density", label: "Competition Density" }
];

function resolveDetail(detail: unknown) {
  if (!detail) return "";
  if (typeof detail === "string") return detail;
  if (typeof detail === "object") {
    const value = detail as MetricDetail;
    return value.reason || value.improve_with || "";
  }
  return "";
}

export function IdeaRatingPanel({
  ideaRating,
  details,
  className,
  showHeader = true
}: IdeaRatingPanelProps) {
  const scores = rows
    .map((row) => Number((ideaRating as any)?.[row.key]))
    .filter((value) => Number.isFinite(value)) as number[];
  const average = scores.length ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length) : 0;

  return (
    <div className={clsx("idea-rating-panel", className)}>
      {showHeader && (
        <div className="idea-rating-head">
          <div>
            <h2 className="idea-rating-title">Idea Rating</h2>
            <p className="idea-rating-sub">Detailed scoring with improvement guidance.</p>
          </div>
          <div className="idea-rating-total">
            <span>{average}</span>
            <small>/100</small>
          </div>
        </div>
      )}

      <div className="idea-rating-grid">
        {rows.map(({ key, label }) => {
          const score = Number((ideaRating as any)?.[key]);
          const value = Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0;
          const detail = resolveDetail((details || {})[key]);
          return (
            <div key={key} className="idea-rating-row">
              <div className="idea-rating-row-top">
                <span>{label}</span>
                <strong>{value}/100</strong>
              </div>
              <div className="idea-rating-bar">
                <span style={{ width: `${value}%` }} />
              </div>
              {detail && <p className="idea-rating-detail">{detail}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
