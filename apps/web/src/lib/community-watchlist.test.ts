import { describe, expect, it, beforeEach } from "vitest";
import {
  isCommunityWatched,
  pinCommunity,
  readCommunityWatchlist,
  unpinCommunity,
  writeCommunityWatchlist,
} from "./community-watchlist";

const WALLET_A = "GWALLETA";
const WALLET_B = "GWALLETB";
const COMMUNITY_X = "CCOMMUNITYX";
const COMMUNITY_Y = "CCOMMUNITYY";

beforeEach(() => {
  localStorage.clear();
});

describe("pinCommunity / unpinCommunity", () => {
  it("pins a community that was not already watched", () => {
    const next = pinCommunity([], COMMUNITY_X, "Aqua DAO");
    expect(next).toHaveLength(1);
    expect(next[0].communityId).toBe(COMMUNITY_X);
    expect(next[0].name).toBe("Aqua DAO");
  });

  it("is a no-op when the community is already pinned", () => {
    const first = pinCommunity([], COMMUNITY_X, "Aqua DAO", "2026-01-01T00:00:00.000Z");
    const second = pinCommunity(first, COMMUNITY_X, "Aqua DAO (renamed)", "2026-01-02T00:00:00.000Z");
    expect(second).toBe(first);
    expect(second[0].name).toBe("Aqua DAO");
  });

  it("unpins a watched community", () => {
    const pinned = pinCommunity([], COMMUNITY_X, "Aqua DAO");
    const unpinned = unpinCommunity(pinned, COMMUNITY_X);
    expect(unpinned).toHaveLength(0);
  });

  it("is a no-op when unpinning a community that was never pinned", () => {
    const entries = pinCommunity([], COMMUNITY_X, "Aqua DAO");
    const result = unpinCommunity(entries, COMMUNITY_Y);
    expect(result).toBe(entries);
  });

  it("supports multiple pinned communities independently", () => {
    let entries = pinCommunity([], COMMUNITY_X, "Aqua DAO");
    entries = pinCommunity(entries, COMMUNITY_Y, "Soroswap DAO");
    expect(entries).toHaveLength(2);
    entries = unpinCommunity(entries, COMMUNITY_X);
    expect(entries).toHaveLength(1);
    expect(entries[0].communityId).toBe(COMMUNITY_Y);
  });
});

describe("isCommunityWatched", () => {
  it("reports false for an empty watchlist", () => {
    expect(isCommunityWatched([], COMMUNITY_X)).toBe(false);
  });

  it("reports true once pinned, false again after unpinning", () => {
    const pinned = pinCommunity([], COMMUNITY_X, "Aqua DAO");
    expect(isCommunityWatched(pinned, COMMUNITY_X)).toBe(true);
    const unpinned = unpinCommunity(pinned, COMMUNITY_X);
    expect(isCommunityWatched(unpinned, COMMUNITY_X)).toBe(false);
  });
});

describe("storage persistence", () => {
  it("round-trips through storage for one wallet", () => {
    const entries = pinCommunity([], COMMUNITY_X, "Aqua DAO");
    writeCommunityWatchlist(WALLET_A, entries);
    expect(readCommunityWatchlist(WALLET_A)).toEqual(entries);
  });

  it("isolates watchlists per wallet address", () => {
    writeCommunityWatchlist(WALLET_A, pinCommunity([], COMMUNITY_X, "Aqua DAO"));
    writeCommunityWatchlist(WALLET_B, pinCommunity([], COMMUNITY_Y, "Soroswap DAO"));

    expect(readCommunityWatchlist(WALLET_A)).toHaveLength(1);
    expect(readCommunityWatchlist(WALLET_A)[0].communityId).toBe(COMMUNITY_X);
    expect(readCommunityWatchlist(WALLET_B)).toHaveLength(1);
    expect(readCommunityWatchlist(WALLET_B)[0].communityId).toBe(COMMUNITY_Y);
  });

  it("returns an empty array for a wallet with nothing saved", () => {
    expect(readCommunityWatchlist(WALLET_A)).toEqual([]);
  });

  it("returns an empty array for an empty wallet address", () => {
    expect(readCommunityWatchlist("")).toEqual([]);
  });

  it("fails closed (empty array) on corrupted JSON rather than throwing", () => {
    localStorage.setItem("stolla:community-watchlist:v1:" + WALLET_A, "{not json");
    expect(readCommunityWatchlist(WALLET_A)).toEqual([]);
  });

  it("fails closed on an unexpected version or shape", () => {
    localStorage.setItem(
      "stolla:community-watchlist:v1:" + WALLET_A,
      JSON.stringify({ version: 2, entries: [] }),
    );
    expect(readCommunityWatchlist(WALLET_A)).toEqual([]);
  });

  it("drops malformed entries instead of throwing", () => {
    localStorage.setItem(
      "stolla:community-watchlist:v1:" + WALLET_A,
      JSON.stringify({ version: 1, entries: [{ communityId: COMMUNITY_X }] }),
    );
    expect(readCommunityWatchlist(WALLET_A)).toEqual([]);
  });
});
