import { describe, it, expect } from "vitest";
import { fmt, pct, quorumProgress } from "./voteDisplay";

describe("pct", () => {
  it("returns 0 when the whole is zero (avoids division by zero)", () => {
    expect(pct(BigInt(100), BigInt(0))).toBe(0);
  });

  it("returns 0 when the whole is negative", () => {
    expect(pct(BigInt(100), -BigInt(5))).toBe(0);
  });

  it("computes a simple percentage", () => {
    expect(pct(BigInt(50), BigInt(100))).toBe(50);
    expect(pct(BigInt(25), BigInt(100))).toBe(25);
  });

  it("returns 100 when part equals whole", () => {
    expect(pct(BigInt(100), BigInt(100))).toBe(100);
  });

  it("clamps values above 100", () => {
    expect(pct(BigInt(150), BigInt(100))).toBe(100);
    expect(pct(BigInt(200), BigInt(100))).toBe(100);
  });

  it("clamps negative parts to 0", () => {
    expect(pct(-BigInt(10), BigInt(100))).toBe(0);
  });

  it("rounds down partial percentages", () => {
    // 1/3 of 100 = 33.33 -> 33
    expect(pct(BigInt(1), BigInt(3))).toBe(33);
    // 2/3 of 100 = 66.66 -> 66
    expect(pct(BigInt(2), BigInt(3))).toBe(66);
  });

  it("handles large bigint weights without precision loss", () => {
    const huge = BigInt(340282366920938463463374607431768211455);
    expect(pct(huge, huge)).toBe(100);
    expect(pct(BigInt(0), huge)).toBe(0);
    expect(pct(huge - BigInt(1), huge)).toBe(99);
  });
});

describe("fmt", () => {
  it("formats zero", () => {
    expect(fmt(BigInt(0))).toBe("0");
  });

  it("formats small integers", () => {
    expect(fmt(BigInt(7))).toBe("7");
    expect(fmt(BigInt(42))).toBe("42");
  });

  it("returns a non-empty string for large values", () => {
    expect(typeof fmt(BigInt(1000000))).toBe("string");
    expect(fmt(BigInt(1000000)).length).toBeGreaterThan(0);
  });
});

describe("quorumProgress", () => {
  const totals = (forVotes: bigint, abstain = BigInt(0), against = BigInt(0)) => ({
    for: forVotes, abstain, against, total: forVotes + abstain + against,
  });

  it("counts only For + Abstain, matching the Governor", () => {
    expect(quorumProgress(totals(BigInt(2), BigInt(1), BigInt(100)), BigInt(4)))
      .toEqual({ state: "pending", percent: 75, participating: BigInt(3), remaining: BigInt(1) });
  });

  it("compares huge bigint totals exactly at the quorum boundary", () => {
    const quorum = BigInt("340282366920938463463374607431768211455");
    expect(quorumProgress(totals(quorum - BigInt(1)), quorum)).toMatchObject({ state: "pending", percent: 99, remaining: BigInt(1) });
    expect(quorumProgress(totals(quorum), quorum)).toMatchObject({ state: "met", percent: 100, remaining: BigInt(0) });
    expect(quorumProgress(totals(quorum + BigInt(1)), quorum)).toMatchObject({ state: "met", percent: 100 });
  });

  it.each([null, undefined, BigInt(0), -BigInt(1)])("marks missing or invalid quorum unavailable (%s)", (quorum) => {
    expect(quorumProgress(totals(BigInt(0)), quorum)).toMatchObject({ state: "unavailable", percent: null });
  });
});
