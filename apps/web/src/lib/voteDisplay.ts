import type { VoteTotals } from "./proposal-events/votes";

/** Format a bigint as a locale string for display */
export function fmt(n: bigint): string {
  return n.toLocaleString();
}

/** Percentage as an integer 0–100, clamping safely */
export function pct(part: bigint, whole: bigint): number {
  if (whole <= BigInt(0)) return 0;
  const raw = Number((part * BigInt(100)) / whole);
  return Math.min(100, Math.max(0, raw));
}


/** Governor quorum counts For + Abstain, excluding Against (see contract tests). */
export function quorumProgress(
  totals: VoteTotals | null | undefined,
  quorum: bigint | null | undefined,
) {
  if (!totals || quorum === null || quorum === undefined || quorum <= BigInt(0)) {
    return { state: "unavailable" as const, percent: null, participating: null, remaining: null };
  }
  const participating = totals.for + totals.abstain;
  const met = participating >= quorum;
  return {
    state: met ? "met" as const : "pending" as const,
    percent: pct(participating, quorum),
    participating,
    remaining: met ? BigInt(0) : quorum - participating,
  };
}
