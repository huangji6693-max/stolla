import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  useWallet: vi.fn(),
  createGovernorClient: vi.fn(),
  storeProposalId: vi.fn(),
  useProposalDiscovery: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/context/WalletProvider", () => ({
  useWallet: mocks.useWallet,
}));

vi.mock("@/lib/contracts", () => ({
  createGovernorClient: mocks.createGovernorClient,
  storeProposalId: mocks.storeProposalId,
}));

vi.mock("@/lib/stellar", () => ({
  config: {
    rpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: "Test SDF Network ; September 2015",
  },
  contractIds: { governor: "CGOVERNOR" },
  requireContractIds: () => ({ governor: "CGOVERNOR" }),
  activeCapabilities: { privilegedWrites: { available: true } },
}));

vi.mock("@/hooks/useProposalDiscovery", () => ({
  useProposalDiscovery: mocks.useProposalDiscovery,
}));

// ProposalsPage reads/writes the state filter through the Next router;
// this page does not render inside a real App Router tree in tests, so
// the hook is mocked outright rather than requiring a router provider.
vi.mock("next/navigation", () => ({
  usePathname: () => "/proposals",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import ProposalsPage from "@/app/(app)/proposals/page";
import { readProposalDraft } from "@/lib/proposal-draft";

const GOVERNOR = "CGOVERNOR";

function ensureCreateOpen() {
  if (!screen.queryByRole("textbox", { name: "Title (required)" })) {
    fireEvent.click(screen.getByRole("button", { name: "New proposal" }));
  }
}

function fillDraft() {
  ensureCreateOpen();
  fireEvent.change(screen.getByRole("textbox", { name: "Title (required)" }), {
    target: { value: "Fund the grants program" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Summary (required)" }), {
    target: { value: "Approve the community grants program." },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Body (required)" }), {
    target: { value: "Fund reviewed grants from the community treasury." },
  });
}

describe("ProposalsPage draft autosave", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.refresh.mockResolvedValue(true);
    mocks.useWallet.mockReturnValue({
      address: "GWALLET",
      signTransaction: vi.fn(),
      isConnecting: false,
    });
    mocks.useProposalDiscovery.mockReturnValue({
      proposals: [],
      proposalIds: [],
      loading: false,
      error: null,
      empty: true,
      refresh: mocks.refresh,
    });
    mocks.createGovernorClient.mockReturnValue({
      propose: vi.fn(),
      proposal_state: vi.fn(),
    });
  });

  it("autosaves fields as they are typed", async () => {
    render(<ProposalsPage />);
    fillDraft();

    await waitFor(() => {
      const draft = readProposalDraft(GOVERNOR);
      expect(draft?.title).toBe("Fund the grants program");
      expect(draft?.summary).toBe("Approve the community grants program.");
      expect(draft?.body).toBe("Fund reviewed grants from the community treasury.");
    });
  });

  it("shows no restore banner when there is nothing saved", () => {
    render(<ProposalsPage />);
    expect(
      screen.queryByText(/unsaved proposal draft/i),
    ).not.toBeInTheDocument();
  });

  it("offers to restore a saved draft on mount, and Continue repopulates the fields", async () => {
    const first = render(<ProposalsPage />);
    fillDraft();
    await waitFor(() => expect(readProposalDraft(GOVERNOR)?.title).toBe("Fund the grants program"));

    // Simulate a refresh: unmount the first instance, then mount a fresh one.
    first.unmount();
    render(<ProposalsPage />);

    expect(screen.getByText(/unsaved proposal draft/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue draft" }));

    expect(
      screen.getByRole("textbox", { name: "Title (required)" }),
    ).toHaveValue("Fund the grants program");
    expect(
      screen.queryByText(/unsaved proposal draft/i),
    ).not.toBeInTheDocument();
  });

  it("Discard clears the saved draft and the banner, without touching the empty form", async () => {
    const first = render(<ProposalsPage />);
    fillDraft();
    await waitFor(() => expect(readProposalDraft(GOVERNOR)).not.toBeNull());

    first.unmount();
    render(<ProposalsPage />);
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));

    expect(readProposalDraft(GOVERNOR)).toBeNull();
    expect(
      screen.queryByText(/unsaved proposal draft/i),
    ).not.toBeInTheDocument();
  });

  it("clears the saved draft on a successful propose", async () => {
    const proposalIdHex = "ab".repeat(32);
    mocks.createGovernorClient.mockReturnValue({
      propose: vi.fn().mockResolvedValue({
        sign: async () => {},
        send: async () => ({
          result: Uint8Array.from(Buffer.from(proposalIdHex, "hex")),
          hash: "a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0",
        }),
      }),
      proposal_state: vi.fn(),
    });

    render(<ProposalsPage />);
    fillDraft();
    await waitFor(() => expect(readProposalDraft(GOVERNOR)).not.toBeNull());

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Create proposal" }));
    });

    await waitFor(() => expect(readProposalDraft(GOVERNOR)).toBeNull(), { timeout: 3000 });
  });
});
