import { MentorNotes } from "../lib/types";

export function MentorPanel({ mentor }: { mentor: MentorNotes }) {
  return (
    <div className="card p-6">
      <h2 className="font-display text-xl">AI Mentor</h2>
      <p className="text-sm text-black/60 mt-2">Guidance adapts to your stage completion.</p>
      <div className="mt-4 space-y-3 text-sm">
        <p className="text-black/70">{mentor.summary}</p>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-black/50">Next steps</p>
          <ul className="mt-2 space-y-1">
            {mentor.next_steps.map((step) => (
              <li key={step} className="text-xs text-black/70">{step}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-black/50">Pitfalls</p>
          <ul className="mt-2 space-y-1">
            {mentor.pitfalls.map((pitfall) => (
              <li key={pitfall} className="text-xs text-black/70">{pitfall}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-black/50">FAQ</p>
          <ul className="mt-2 space-y-2">
            {mentor.faq.map((item) => (
              <li key={item.question} className="text-xs text-black/70">
                <span className="font-semibold">{item.question}</span> {item.answer}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <input
        className="mt-4 w-full rounded-full border border-black/10 px-4 py-2 text-sm"
        placeholder="Ask your mentor... (coming soon)"
      />
    </div>
  );
}
