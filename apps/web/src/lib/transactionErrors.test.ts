import { describe, expect, it } from "vitest";
import { IpfsPinError } from "@/lib/ipfs/pin";
import {
  describeDeploymentError,
  describePinError,
  getTransactionErrorCatalogEntry,
  mapTransactionError,
  TRANSACTION_ERROR_CATALOG,
  TRANSACTION_ERROR_CATEGORIES,
  TRANSACTION_ERROR_CODES,
} from "@/lib/transactionErrors";

describe("mapTransactionError", () => {
  it("exposes a finite category set", () => {
    expect(TRANSACTION_ERROR_CATEGORIES).toEqual([
      "wallet_rejected",
      "wallet_unavailable",
      "simulation_failed",
      "rpc_unavailable",
      "send_failed",
      "confirmation_timeout",
      "still_pending",
      "contract_error",
      "unknown",
    ]);
  });

  it("defines a complete catalog entry for every error code", () => {
    for (const code of TRANSACTION_ERROR_CODES) {
      const entry = getTransactionErrorCatalogEntry(code);
      expect(entry).toEqual(TRANSACTION_ERROR_CATALOG[code]);
      expect(entry.code).toBe(code);
      expect(TRANSACTION_ERROR_CATEGORIES).toContain(entry.category);
      expect(entry.title.length).toBeGreaterThan(0);
      expect(entry.message.length).toBeGreaterThan(0);
      expect(entry.cta.length).toBeGreaterThan(0);
      expect(typeof entry.retryable).toBe("boolean");
    }
  });

  it.each([
    [
      "wallet_rejected",
      new Error("User rejected the request"),
      "You rejected the wallet request",
    ],
    [
      "wallet_unavailable",
      new Error("Freighter is not installed"),
      "No wallet is available",
    ],
    [
      "simulation_failed",
      new Error("Simulation failed: insufficient resources"),
      "could not be simulated",
    ],
    [
      "rpc_unavailable",
      new Error("Failed to fetch"),
      "temporarily unreachable",
    ],
    [
      "send_failed",
      new Error("SendTransaction failed with status ERROR"),
      "could not be submitted",
    ],
    [
      "confirmation_timeout",
      new Error("Confirmation timeout after 30s"),
      "Confirmation timed out",
    ],
    [
      "still_pending",
      new Error("TransactionStillPending: Waited 30 seconds"),
      "still pending on the network",
    ],
    [
      "contract_error",
      new Error("HostError: Error(Contract, #5016) AlreadyVoted"),
      "contract rejected",
    ],
    [
      "unknown",
      new Error("weird opaque blob"),
      "Something went wrong",
    ],
  ] as const)(
    "maps %s to stable user-facing copy",
    (category, error, messagePart) => {
      const mapped = mapTransactionError(error);
      expect(mapped.category).toBe(category);
      expect(mapped.message).toMatch(new RegExp(messagePart, "i"));
      expect(mapped.title.length).toBeGreaterThan(0);
      expect(mapped.cta.length).toBeGreaterThan(0);
      expect(mapped.diagnostic).toBe(error.message);
      expect(mapped.message).not.toContain("XDR");
      expect(mapped.message).not.toContain(error.message);
    },
  );

  it("maps granular Soroban simulation and contract codes to catalog entries", () => {
    const insufficient = mapTransactionError(
      new Error("simulation failed: insufficient balance for fee"),
    );
    expect(insufficient.code).toBe("insufficient_balance");
    expect(insufficient.category).toBe("simulation_failed");
    expect(insufficient.cta).toBe("Fund account and retry");

    const resourceLimit = mapTransactionError(
      new Error("Simulation failed: cpu resource budget exceeded"),
    );
    expect(resourceLimit.code).toBe("resource_limit_exceeded");
    expect(resourceLimit.category).toBe("simulation_failed");
    expect(resourceLimit.cta).toBe("Adjust inputs and retry");

    const expired = mapTransactionError(new Error("tx_bad_seq"));
    expect(expired.code).toBe("expired_or_stale_tx");
    expect(expired.category).toBe("send_failed");
    expect(expired.cta).toBe("Rebuild transaction");

    const alreadyVoted = mapTransactionError(
      new Error("HostError: Error(Contract, #5016) AlreadyVoted"),
    );
    expect(alreadyVoted.code).toBe("already_voted");
    expect(alreadyVoted.category).toBe("contract_error");
    expect(alreadyVoted.retryable).toBe(false);

    const unauthorized = mapTransactionError(
      new Error("HostError: caller is not authorized"),
    );
    expect(unauthorized.code).toBe("unauthorized");
    expect(unauthorized.category).toBe("contract_error");
    expect(unauthorized.retryable).toBe(false);
  });

  it("keeps IPFS pin and configuration errors distinct from wallet_rejected", () => {
    const configErr = new IpfsPinError(
      "config",
      "Set PINATA_JWT before minting.",
    );
    const mappedConfig = mapTransactionError(configErr);
    expect(mappedConfig.code).toBe("pin_config_error");
    expect(mappedConfig.category).not.toBe("wallet_rejected");
    expect(mappedConfig.retryable).toBe(false);

    const describedConfig = describePinError(configErr);
    expect(describedConfig.code).toBe("pin_config_error");
    expect(describedConfig.retryable).toBe(false);
    expect(describedConfig.message).toMatch(/Set PINATA_JWT/);
    expect(describedConfig.message).toMatch(/Retrying will not help/);

    const providerErr = new IpfsPinError(
      "provider",
      "Pinata rejected the upload request.",
    );
    const mappedProvider = mapTransactionError(providerErr);
    expect(mappedProvider.code).toBe("pin_failed");
    expect(mappedProvider.category).not.toBe("wallet_rejected");
    expect(mappedProvider.retryable).toBe(true);

    const describedProvider = describePinError(providerErr);
    expect(describedProvider.code).toBe("pin_failed");
    expect(describedProvider.retryable).toBe(true);
    expect(describedProvider.message).toBe("Pinata rejected the upload request.");
  });

  it("maps deployment errors through the catalog while preserving draft guidance", () => {
    expect(
      describeDeploymentError(new Error("User rejected the request")).message,
    ).toMatch(/Wallet approval was declined/i);
    expect(
      describeDeploymentError(new Error("simulation failed: insufficient resource")).message,
    ).toMatch(/insufficient transaction resources/i);
    expect(
      describeDeploymentError(new Error("tx_bad_seq")).message,
    ).toMatch(/fresh sequence, timeout/i);
  });

  it("does not describe wallet rejection as RPC or contract failure", () => {
    const mapped = mapTransactionError(
      new Error("User declined to sign the transaction"),
    );
    expect(mapped.category).toBe("wallet_rejected");
    expect(mapped.message.toLowerCase()).not.toContain("rpc");
    expect(mapped.message.toLowerCase()).not.toContain("contract");
    expect(mapped.message.toLowerCase()).not.toContain("network");
  });

  it("does not describe a still-pending transaction as failed", () => {
    const mapped = mapTransactionError(
      new Error("Waited 20 seconds for transaction to complete, but it is still pending"),
    );
    expect(mapped.category).toBe("still_pending");
    expect(mapped.message.toLowerCase()).toContain("pending");
    expect(mapped.message.toLowerCase()).not.toMatch(/\bfailed\b/);
    expect(mapped.retryable).toBe(false);
  });

  it("uses a safe fallback for non-error values", () => {
    const mapped = mapTransactionError({ secret: "do-not-leak", xdr: "AAAA" });
    expect(mapped.category).toBe("unknown");
    expect(mapped.message).toMatch(/try again/i);
    expect(mapped.diagnostic).toBeNull();
    expect(JSON.stringify(mapped)).not.toContain("do-not-leak");
    expect(JSON.stringify(mapped)).not.toContain("AAAA");
  });
});
