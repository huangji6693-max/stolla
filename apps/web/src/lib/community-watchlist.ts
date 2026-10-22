/**
 * An optional, local-only watchlist so a connected wallet can pin
 * communities it is not a member of, without repeatedly searching the
 * registry. This never claims membership — it is purely a browser-local
 * bookmark list, keyed per wallet address so switching wallets never
 * shows another wallet's pins. Clearing site data (or switching browsers)
 * loses it, by design (no server-side watchlist, no sync).
 */

export type CommunityWatchlistEntry = {
  communityId: string;
  /** Display name captured at pin time, so the "Watching" list can render without re-fetching the registry. */
  name: string;
  pinnedAt: string;
};

export type CommunityWatchlistFile = {
  version: 1;
  entries: CommunityWatchlistEntry[];
};

function nowIso(): string {
  return new Date().toISOString();
}

function storageKey(walletAddress: string): string {
  return `stolla:community-watchlist:v1:${walletAddress}`;
}

function isEntry(value: unknown): value is CommunityWatchlistEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as CommunityWatchlistEntry;
  return (
    typeof entry.communityId === "string" &&
    typeof entry.name === "string" &&
    typeof entry.pinnedAt === "string"
  );
}

export function readCommunityWatchlist(
  walletAddress: string,
): CommunityWatchlistEntry[] {
  if (typeof window === "undefined" || !walletAddress) return [];
  try {
    const raw = localStorage.getItem(storageKey(walletAddress));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      (parsed as CommunityWatchlistFile).version !== 1 ||
      !Array.isArray((parsed as CommunityWatchlistFile).entries)
    ) {
      return [];
    }
    return (parsed as CommunityWatchlistFile).entries.filter(isEntry);
  } catch {
    return [];
  }
}

export function writeCommunityWatchlist(
  walletAddress: string,
  entries: CommunityWatchlistEntry[],
): void {
  if (typeof window === "undefined" || !walletAddress) return;
  const payload: CommunityWatchlistFile = { version: 1, entries };
  localStorage.setItem(storageKey(walletAddress), JSON.stringify(payload));
}

export function isCommunityWatched(
  entries: CommunityWatchlistEntry[],
  communityId: string,
): boolean {
  return entries.some((entry) => entry.communityId === communityId);
}

/** Pins a community. A no-op (returns the same array) if it is already pinned. */
export function pinCommunity(
  entries: CommunityWatchlistEntry[],
  communityId: string,
  name: string,
  now: string = nowIso(),
): CommunityWatchlistEntry[] {
  if (isCommunityWatched(entries, communityId)) return entries;
  return [...entries, { communityId, name, pinnedAt: now }];
}

/** Unpins a community. A no-op (returns the same array) if it was not pinned. */
export function unpinCommunity(
  entries: CommunityWatchlistEntry[],
  communityId: string,
): CommunityWatchlistEntry[] {
  if (!isCommunityWatched(entries, communityId)) return entries;
  return entries.filter((entry) => entry.communityId !== communityId);
}
