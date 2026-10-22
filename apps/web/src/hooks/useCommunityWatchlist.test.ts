import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";

const mocks = vi.hoisted(() => ({ useWallet: vi.fn() }));

vi.mock("@/context/WalletProvider", () => ({
  useWallet: mocks.useWallet,
}));

import { useCommunityWatchlist } from "./useCommunityWatchlist";

const WALLET_A = "GWALLETA";
const WALLET_B = "GWALLETB";
const COMMUNITY_X = "CCOMMUNITYX";

describe("useCommunityWatchlist", () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.useWallet.mockReset();
  });

  it("is empty and disconnected when no wallet is connected", () => {
    mocks.useWallet.mockReturnValue({ address: null });
    const { result } = renderHook(() => useCommunityWatchlist());
    expect(result.current.connected).toBe(false);
    expect(result.current.entries).toEqual([]);
  });

  it("does nothing when toggling while disconnected", () => {
    mocks.useWallet.mockReturnValue({ address: null });
    const { result } = renderHook(() => useCommunityWatchlist());
    act(() => result.current.toggle(COMMUNITY_X, "Aqua DAO"));
    expect(result.current.entries).toEqual([]);
  });

  it("pins and persists a community for the connected wallet", () => {
    mocks.useWallet.mockReturnValue({ address: WALLET_A });
    const { result } = renderHook(() => useCommunityWatchlist());

    act(() => result.current.toggle(COMMUNITY_X, "Aqua DAO"));

    expect(result.current.isWatched(COMMUNITY_X)).toBe(true);
    expect(result.current.entries).toHaveLength(1);

    // A fresh hook instance for the same wallet sees the persisted pin.
    const { result: reloaded } = renderHook(() => useCommunityWatchlist());
    expect(reloaded.current.isWatched(COMMUNITY_X)).toBe(true);
  });

  it("toggling twice pins then unpins", () => {
    mocks.useWallet.mockReturnValue({ address: WALLET_A });
    const { result } = renderHook(() => useCommunityWatchlist());

    act(() => result.current.toggle(COMMUNITY_X, "Aqua DAO"));
    expect(result.current.isWatched(COMMUNITY_X)).toBe(true);

    act(() => result.current.toggle(COMMUNITY_X, "Aqua DAO"));
    expect(result.current.isWatched(COMMUNITY_X)).toBe(false);
    expect(result.current.entries).toHaveLength(0);
  });

  it("isolates watchlists per wallet address", () => {
    mocks.useWallet.mockReturnValue({ address: WALLET_A });
    const { result: hookA } = renderHook(() => useCommunityWatchlist());
    act(() => hookA.current.toggle(COMMUNITY_X, "Aqua DAO"));

    mocks.useWallet.mockReturnValue({ address: WALLET_B });
    const { result: hookB } = renderHook(() => useCommunityWatchlist());
    expect(hookB.current.entries).toEqual([]);
    expect(hookB.current.isWatched(COMMUNITY_X)).toBe(false);
  });

  it("clears its visible entries when the wallet disconnects", () => {
    mocks.useWallet.mockReturnValue({ address: WALLET_A });
    const { result, rerender } = renderHook(() => useCommunityWatchlist());
    act(() => result.current.toggle(COMMUNITY_X, "Aqua DAO"));
    expect(result.current.entries).toHaveLength(1);

    mocks.useWallet.mockReturnValue({ address: null });
    rerender();
    expect(result.current.entries).toEqual([]);
    expect(result.current.connected).toBe(false);
  });
});
