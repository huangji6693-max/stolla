import { useId } from "react";
import type { VoteTotals } from "@/lib/proposal-events/votes";
import { fmt, quorumProgress } from "@/lib/voteDisplay";

export type QuorumProgressProps = {
  totals: VoteTotals | null;
  quorum: bigint | null;
  /** Event history may only provide a lower bound on participation. */
  incomplete?: boolean;
};

export function QuorumProgress({ totals, quorum, incomplete = false }: QuorumProgressProps) {
  const descriptionId = useId();
  const progress = quorumProgress(totals, quorum);
  if (progress.state === "unavailable") {
    return (
      <div className="mt-4 border-t border-slate-700 pt-4" aria-live="polite">
        <h3 className="text-sm font-semibold text-slate-100">Quorum</h3>
        <p className="mt-1 text-sm text-slate-400">Quorum progress unavailable.</p>
      </div>
    );
  }

  const met = progress.state === "met";
  const summary = `${incomplete ? "At least " : ""}${fmt(progress.participating)} of ${fmt(quorum!)} votes toward quorum. ${met ? "Quorum reached." : incomplete ? "Quorum not yet verified." : `${fmt(progress.remaining)} more votes needed.`}`;

  return (
    <div className="mt-4 border-t border-slate-700 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <h3 className="font-semibold text-slate-100">Quorum</h3>
        <span className={met ? "text-emerald-400" : "text-slate-300"}>
          {incomplete ? "At least " : ""}{progress.percent}% · {met ? "Quorum reached" : incomplete ? "Not yet verified" : "Not yet reached"}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Quorum progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.percent}
        aria-valuetext={summary}
        aria-describedby={descriptionId}
        className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-800"
      >
        <div
          className={`h-full rounded-full motion-safe:transition-all ${met ? "bg-emerald-500" : "bg-blue-500"}`}
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-slate-300" aria-live="polite" aria-atomic="true">{summary}</p>
      <p id={descriptionId} className="mt-1 text-xs text-slate-400">
        For and Abstain votes count toward quorum; Against votes do not.
        {incomplete ? " Event history is incomplete; actual progress may be higher." : ""}
      </p>
    </div>
  );
}
