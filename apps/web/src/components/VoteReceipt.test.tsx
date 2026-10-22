import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { VoteReceipt } from "./VoteReceipt";

const props = {
  proposalIdHex: "ab".repeat(32),
  voteType: 1,
  communityName: "Atlas",
  transactionHash: "cd".repeat(32),
};

afterEach(() => vi.unstubAllGlobals());

function browser(clipboard?: { writeText: ReturnType<typeof vi.fn> }, share?: ReturnType<typeof vi.fn>) {
  vi.stubGlobal("navigator", { clipboard, share });
}

describe("VoteReceipt", () => {
  it.each([[0, "Against"], [1, "For"], [2, "Abstain"]])("renders vote choice %s and receipt details", (voteType, label) => {
    render(<VoteReceipt {...props} voteType={voteType as number} />);
    expect(screen.getByRole("region", { name: "Vote receipt" })).toHaveTextContent(String(label));
    expect(screen.getByText("Atlas")).toBeInTheDocument();
    expect(screen.getByTitle(props.proposalIdHex)).toBeInTheDocument();
    expect(screen.getByTitle(props.transactionHash)).toBeInTheDocument();
  });

  it.each([["testnet", "testnet"], ["mainnet", "public"]] as const)("uses the %s explorer", (network, path) => {
    render(<VoteReceipt {...props} network={network} />);
    expect(screen.getByRole("link", { name: "Open in explorer" })).toHaveAttribute(
      "href", `https://stellar.expert/explorer/${path}/tx/${props.transactionHash}`,
    );
  });

  it("copies full identifiers, community, choice, network, and explorer URL", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    browser({ writeText });
    render(<VoteReceipt {...props} network="mainnet" />);
    fireEvent.click(screen.getByRole("button", { name: "Copy receipt" }));
    expect(await screen.findByText("Receipt copied.")).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith([
      `Proposal: ${props.proposalIdHex}`, "Vote: For", "Community: Atlas", "Network: mainnet",
      `Transaction: ${props.transactionHash}`,
      `https://stellar.expert/explorer/public/tx/${props.transactionHash}`,
    ].join("\n"));
  });

  it("shares the receipt through the browser share API", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    browser(undefined, share);
    render(<VoteReceipt {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Share receipt" }));
    expect(await screen.findByText("Receipt shared.")).toBeInTheDocument();
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ text: expect.stringContaining(props.proposalIdHex) }));
  });

  it("falls back to copying when native sharing is unavailable", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    browser({ writeText });
    render(<VoteReceipt {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Share receipt" }));
    expect(await screen.findByText("Receipt copied.")).toBeInTheDocument();
  });

  it("renders a confirmed receipt without inventing a missing hash", () => {
    render(<VoteReceipt {...props} transactionHash={null} />);
    expect(screen.getByText("Vote recorded")).toBeInTheDocument();
    expect(screen.getByText("Your vote is confirmed. Transaction hash unavailable.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open in explorer" })).not.toBeInTheDocument();
  });

  it("omits an invalid explorer link", () => {
    render(<VoteReceipt {...props} transactionHash="invalid" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("handles an unavailable clipboard", async () => {
    browser();
    render(<VoteReceipt {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy receipt" }));
    expect(await screen.findByText("Clipboard is not available in this browser.")).toBeInTheDocument();
  });

  it("handles denied clipboard access", async () => {
    browser({ writeText: vi.fn().mockRejectedValue(new Error("denied")) });
    render(<VoteReceipt {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy receipt" }));
    expect(await screen.findByText("Could not copy the receipt.")).toBeInTheDocument();
  });
});
