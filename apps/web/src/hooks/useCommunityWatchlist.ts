"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "@/context/WalletProvider";
import {
  isCommunityWatched,
  pinCommunity,
  readCommunityWatchlist,
  unpinCommunity,
  writeCommunityWatchlist,
  type CommunityWatchlistEntry,
} from "@/lib/community-watchlist";

/**
 * The connected wallet's local community watchlist. Disconnected wallets
 * see an empty list and cannot toggle entries — there is no wallet
 * address to scope the storage key to, and this never claims membership
 * regardless of connection state.
 */
export function useCommunityWatchlist() {
  const { address } = useWallet();
  const [entries, setEntries] = useState<CommunityWatchlistEntry[]>([]);

  useEffect(() => {
    // Storage is external state keyed by the connected wallet; read it
    // fresh whenever the address changes rather than carrying over.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEntries(address ? readCommunityWatchlist(address) : []);
  }, [address]);

  const toggle = useCallback(
    (communityId: string, name: string) => {
      if (!address) return;
      setEntries((current) => {
        const next = isCommunityWatched(current, communityId)
          ? unpinCommunity(current, communityId)
          : pinCommunity(current, communityId, name);
        writeCommunityWatchlist(address, next);
        return next;
      });
    },
    [address],
  );

  return {
    connected: Boolean(address),
    entries,
    isWatched: useCallback(
      (communityId: string) => isCommunityWatched(entries, communityId),
      [entries],
    ),
    toggle,
  };
}
