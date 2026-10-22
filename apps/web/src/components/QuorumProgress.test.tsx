import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuorumProgress } from "./QuorumProgress";

const totals = (forVotes: bigint, abstain = BigInt(0), against = BigInt(0)) => ({
  for: forVotes, abstain, against, total: forVotes + abstain + against,
});

describe("QuorumProgress", () => {
  it("shows genuine zero participation", () => {
    render(<QuorumProgress totals={totals(BigInt(0))} quorum={BigInt(10)} />);
    expect(screen.getByRole("progressbar", { name: "Quorum progress" })).toHaveAttribute("aria-valuenow", "0");
    expect(screen.getByText(/10 more votes needed/)).toBeInTheDocument();
  });

  it("shows partial progress from For and Abstain, excluding Against", () => {
    render(<QuorumProgress totals={totals(BigInt(2), BigInt(3), BigInt(100))} quorum={BigInt(10)} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "50");
    expect(bar).toHaveAttribute("aria-valuetext", "5 of 10 votes toward quorum. 5 more votes needed.");
    expect(screen.getByText(/Against votes do not/)).toBeInTheDocument();
  });

  it.each([BigInt(10), BigInt(15)])("marks quorum reached and caps the bar", (forVotes) => {
    render(<QuorumProgress totals={totals(forVotes)} quorum={BigInt(10)} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuetext", expect.stringContaining("Quorum reached."));
  });

  it.each([null, BigInt(0)])("never presents an unavailable quorum as zero progress (%s)", (quorum) => {
    render(<QuorumProgress totals={totals(BigInt(0))} quorum={quorum} />);
    expect(screen.getByText("Quorum progress unavailable.")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByText(/0%/)).not.toBeInTheDocument();
  });

  it("keeps unavailable totals distinct from no votes", () => {
    render(<QuorumProgress totals={null} quorum={BigInt(10)} />);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.getByText("Quorum progress unavailable.")).toBeInTheDocument();
  });

  it("updates when the parent refreshes totals", () => {
    const { rerender } = render(<QuorumProgress totals={totals(BigInt(1))} quorum={BigInt(10)} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "10");
    rerender(<QuorumProgress totals={totals(BigInt(10))} quorum={BigInt(10)} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
    expect(screen.getByText("10 of 10 votes toward quorum. Quorum reached.")).toHaveAttribute("aria-live", "polite");
  });

  it("labels incomplete history as a lower bound without declaring unmet quorum", () => {
    render(<QuorumProgress totals={totals(BigInt(5))} quorum={BigInt(10)} incomplete />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "At least 5 of 10 votes toward quorum. Quorum not yet verified.");
    expect(screen.getByText(/actual progress may be higher/)).toBeInTheDocument();
  });
});
