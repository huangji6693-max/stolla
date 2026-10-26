/**
 * Typed frontend taxonomy and plain-language catalog for Soroban simulation,
 * signing, submission, confirmation, and IPFS pinning errors.
 */
export const TRANSACTION_ERROR_CATEGORIES = [
  "wallet_rejected",
  "wallet_unavailable",
  "simulation_failed",
  "rpc_unavailable",
  "send_failed",
  "confirmation_timeout",
  "still_pending",
  "contract_error",
  "unknown",
] as const;

export type TransactionErrorCategory =
  (typeof TRANSACTION_ERROR_CATEGORIES)[number];

export const TRANSACTION_ERROR_CODES = [
  "wallet_rejected",
  "wallet_unavailable",
  "wrong_network",
  "insufficient_balance",
  "resource_limit_exceeded",
  "simulation_failed",
  "expired_or_stale_tx",
  "rpc_unavailable",
  "send_failed",
  "confirmation_timeout",
  "still_pending",
  "already_voted",
  "unauthorized",
  "contract_error",
  "pin_config_error",
  "pin_validation_error",
  "pin_failed",
  "unknown",
] as const;

export type TransactionErrorCode = (typeof TRANSACTION_ERROR_CODES)[number];

export type TransactionErrorCatalogEntry = {
  code: TransactionErrorCode;
  category: TransactionErrorCategory;
  /** Short plain-language heading suitable for banners or status cards. */
  title: string;
  /** Actionable plain-language explanation safe to render directly. */
  message: string;
  /** Recommended next-step call to action for the user. */
  cta: string;
  /** Whether the user can reasonably retry the same action without changing config. */
  retryable: boolean;
};

export type MappedTransactionError = TransactionErrorCatalogEntry & {
  /** Technical detail for collapsible diagnostics (never render as primary copy). */
  diagnostic: string | null;
};

export const TRANSACTION_ERROR_CATALOG: Record<
  TransactionErrorCode,
  TransactionErrorCatalogEntry
> = {
  wallet_rejected: {
    code: "wallet_rejected",
    category: "wallet_rejected",
    title: "Wallet approval declined",
    message:
      "You rejected the wallet request. Approve the next prompt to continue.",
    cta: "Approve in wallet",
    retryable: true,
  },
  wallet_unavailable: {
    code: "wallet_unavailable",
    category: "wallet_unavailable",
    title: "Wallet not connected",
    message:
      "No wallet is available. Connect or unlock your Stellar wallet, then try again.",
    cta: "Connect wallet",
    retryable: true,
  },
  wrong_network: {
    code: "wrong_network",
    category: "wallet_unavailable",
    title: "Wrong Stellar network",
    message:
      "No wallet is available on the configured Stellar network. Switch your wallet network, then try again.",
    cta: "Switch wallet network",
    retryable: true,
  },
  insufficient_balance: {
    code: "insufficient_balance",
    category: "simulation_failed",
    title: "Insufficient balance or fee reserves",
    message:
      "The transaction could not be simulated due to insufficient balance or fee reserves. Fund your Stellar account and retry.",
    cta: "Fund account and retry",
    retryable: true,
  },
  resource_limit_exceeded: {
    code: "resource_limit_exceeded",
    category: "simulation_failed",
    title: "Resource limit exceeded",
    message:
      "The transaction could not be simulated because Soroban resource limits were exceeded. Check your inputs and account state, then retry.",
    cta: "Adjust inputs and retry",
    retryable: true,
  },
  simulation_failed: {
    code: "simulation_failed",
    category: "simulation_failed",
    title: "Simulation failed",
    message:
      "The transaction could not be simulated. Check your inputs and account state, then retry.",
    cta: "Retry simulation",
    retryable: true,
  },
  expired_or_stale_tx: {
    code: "expired_or_stale_tx",
    category: "send_failed",
    title: "Transaction expired or stale sequence",
    message:
      "The transaction could not be submitted because it expired or used a stale sequence. Rebuild from your draft and retry.",
    cta: "Rebuild transaction",
    retryable: true,
  },
  rpc_unavailable: {
    code: "rpc_unavailable",
    category: "rpc_unavailable",
    title: "Stellar RPC unavailable",
    message:
      "The Stellar network is temporarily unreachable. Wait a moment and try again.",
    cta: "Retry request",
    retryable: true,
  },
  send_failed: {
    code: "send_failed",
    category: "send_failed",
    title: "Submission failed",
    message:
      "The transaction could not be submitted. Check your connection and retry.",
    cta: "Retry submission",
    retryable: true,
  },
  confirmation_timeout: {
    code: "confirmation_timeout",
    category: "confirmation_timeout",
    title: "Confirmation timed out",
    message:
      "Confirmation timed out. The transaction may still be pending—check an explorer before retrying.",
    cta: "Check explorer",
    retryable: false,
  },
  still_pending: {
    code: "still_pending",
    category: "still_pending",
    title: "Transaction still pending",
    message:
      "The transaction is still pending on the network. Check your wallet or explorer before submitting again.",
    cta: "Check status",
    retryable: false,
  },
  already_voted: {
    code: "already_voted",
    category: "contract_error",
    title: "Already voted",
    message:
      "The contract rejected this operation because this account has already voted on this proposal.",
    cta: "View vote status",
    retryable: false,
  },
  unauthorized: {
    code: "unauthorized",
    category: "contract_error",
    title: "Account not authorized",
    message:
      "The contract rejected this operation because the connected wallet is not authorized. Review the requirements and try a different action.",
    cta: "Switch account",
    retryable: false,
  },
  contract_error: {
    code: "contract_error",
    category: "contract_error",
    title: "Contract rejected operation",
    message:
      "The contract rejected this operation. Review the requirements and try a different action.",
    cta: "Review requirements",
    retryable: false,
  },
  pin_config_error: {
    code: "pin_config_error",
    category: "unknown",
    title: "IPFS pinning not configured",
    message:
      "IPFS pinning is not configured on this server. Set PINATA_JWT before creating communities or minting. Retrying will not help until the server is configured.",
    cta: "Configure PINATA_JWT",
    retryable: false,
  },
  pin_validation_error: {
    code: "pin_validation_error",
    category: "unknown",
    title: "Metadata validation failed",
    message:
      "The metadata or image was rejected before upload. Update the file or fields and try again.",
    cta: "Fix metadata",
    retryable: false,
  },
  pin_failed: {
    code: "pin_failed",
    category: "unknown",
    title: "Metadata upload failed",
    message:
      "Metadata upload to IPFS could not be completed. Check your connection and retry.",
    cta: "Retry upload",
    retryable: true,
  },
  unknown: {
    code: "unknown",
    category: "unknown",
    title: "Transaction error",
    message:
      "Something went wrong while processing the transaction. Please try again.",
    cta: "Try again",
    retryable: true,
  },
};

export function getTransactionErrorCatalogEntry(
  code: TransactionErrorCode,
): TransactionErrorCatalogEntry {
  return TRANSACTION_ERROR_CATALOG[code];
}

function asDiagnostic(error: unknown): string | null {
  if (error instanceof Error) {
    const text = error.message?.trim();
    return text ? text.slice(0, 500) : error.name || null;
  }
  if (typeof error === "string") {
    const text = error.trim();
    return text ? text.slice(0, 500) : null;
  }
  return null;
}

function lowerText(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name} ${error.message}`.toLowerCase();
  }
  if (typeof error === "string") return error.toLowerCase();
  return "";
}

function extractPinErrorKind(
  error: unknown,
): "config" | "validation" | "network" | "provider" | null {
  if (!error || typeof error !== "object") return null;
  const candidate = error as { name?: unknown; kind?: unknown };
  if (
    candidate.name === "IpfsPinError" &&
    (candidate.kind === "config" ||
      candidate.kind === "validation" ||
      candidate.kind === "network" ||
      candidate.kind === "provider")
  ) {
    return candidate.kind;
  }
  return null;
}

function classifyCode(error: unknown): TransactionErrorCode {
  const pinKind = extractPinErrorKind(error);
  if (pinKind === "config") return "pin_config_error";
  if (pinKind === "validation") return "pin_validation_error";
  if (pinKind === "network" || pinKind === "provider") return "pin_failed";

  const text = lowerText(error);

  if (
    text.includes("pinata_jwt") ||
    text.includes("ipfs pinning is not configured") ||
    text.includes("pinning is not configured")
  ) {
    return "pin_config_error";
  }

  if (
    text.includes("ipfspinerror") ||
    text.includes("pinata") ||
    text.includes("pin request failed") ||
    text.includes("pin service") ||
    text.includes("metadata upload")
  ) {
    return "pin_failed";
  }

  if (
    text.includes("user rejected") ||
    text.includes("user declined") ||
    text.includes("rejected the request") ||
    text.includes("rejected by user") ||
    text.includes("request rejected") ||
    text.includes("user cancelled") ||
    text.includes("user canceled") ||
    text.includes("closed the modal") ||
    text.includes("wallet closed") ||
    (text.includes("denied") && text.includes("user"))
  ) {
    return "wallet_rejected";
  }

  if (
    text.includes("network") &&
    (text.includes("passphrase") ||
      text.includes("mismatch") ||
      text.includes("different stellar network") ||
      text.includes("wrong network"))
  ) {
    return "wrong_network";
  }

  if (
    text.includes("no wallet") ||
    text.includes("wallet not found") ||
    text.includes("wallet unavailable") ||
    text.includes("wallet is not connected") ||
    (text.includes("freighter") && text.includes("not installed"))
  ) {
    return "wallet_unavailable";
  }

  if (
    text.includes("still pending") ||
    text.includes("transactionstillpending") ||
    (text.includes("pending") && text.includes("waited"))
  ) {
    return "still_pending";
  }

  if (
    text.includes("timed out") ||
    text.includes("timeout") ||
    text.includes("confirmation timeout")
  ) {
    return "confirmation_timeout";
  }

  if (
    text.includes("failed to fetch") ||
    text.includes("networkerror") ||
    text.includes("network request failed") ||
    text.includes("econnrefused") ||
    text.includes("enotfound") ||
    (text.includes("rpc") &&
      (text.includes("unavailable") || text.includes("unreachable")))
  ) {
    return "rpc_unavailable";
  }

  if (
    /expired|timebounds|too[_ ]?late|bad[_ ]?seq|sequence number|stale/i.test(
      text,
    )
  ) {
    return "expired_or_stale_tx";
  }

  if (text.includes("simulation") || text.includes("simulate")) {
    if (
      text.includes("insufficient") &&
      (text.includes("balance") ||
        text.includes("fee") ||
        text.includes("reserve") ||
        text.includes("xlm") ||
        text.includes("stroop"))
    ) {
      return "insufficient_balance";
    }
    if (
      text.includes("resource") ||
      text.includes("budget") ||
      text.includes("cpu") ||
      text.includes("memory") ||
      text.includes("footprint")
    ) {
      return "resource_limit_exceeded";
    }
    return "simulation_failed";
  }

  if (
    text.includes("alreadyvoted") ||
    text.includes("already voted") ||
    text.includes("#5016") ||
    text.includes("error 5016")
  ) {
    return "already_voted";
  }

  if (
    text.includes("unauthorized") ||
    text.includes("not authorized") ||
    text.includes("not the owner") ||
    text.includes("only the owner") ||
    text.includes("unreachablecodereached")
  ) {
    return "unauthorized";
  }

  if (
    text.includes("hosterror") ||
    text.includes("traphost") ||
    (text.includes("contract") &&
      (text.includes("error") ||
        text.includes("rejected") ||
        text.includes("panic"))) ||
    text.includes("error(contract") ||
    text.includes("error(wasm") ||
    text.includes("insufficient")
  ) {
    return "contract_error";
  }

  if (
    text.includes("send failed") ||
    text.includes("sendtransaction") ||
    text.includes("submission failed") ||
    text.includes("failed to send") ||
    text.includes("could not be confirmed")
  ) {
    return "send_failed";
  }

  if (
    text.includes("rejected") ||
    text.includes("cancelled") ||
    text.includes("canceled")
  ) {
    return "wallet_rejected";
  }

  return "unknown";
}

/**
 * Map an unknown transaction failure into a catalog-backed plain-language
 * user message with collapsible diagnostic detail.
 */
export function mapTransactionError(error: unknown): MappedTransactionError {
  const code = classifyCode(error);
  const entry = TRANSACTION_ERROR_CATALOG[code];
  return {
    ...entry,
    diagnostic: asDiagnostic(error),
  };
}

/**
 * Map an IPFS pinning / metadata upload failure into a catalog-backed entry
 * while keeping configuration and validation errors distinct from wallet
 * rejections and retryable network/provider errors.
 */
export function describePinError(error: unknown): MappedTransactionError {
  const diagnostic = asDiagnostic(error);
  const pinKind = extractPinErrorKind(error);

  if (pinKind === "config") {
    const entry = TRANSACTION_ERROR_CATALOG.pin_config_error;
    const raw = diagnostic ?? entry.message;
    const message = /retrying will not help/i.test(raw)
      ? raw
      : `${raw} Retrying will not help until the server is configured.`;
    return {
      ...entry,
      message,
      diagnostic,
    };
  }

  if (pinKind === "validation") {
    const entry = TRANSACTION_ERROR_CATALOG.pin_validation_error;
    return {
      ...entry,
      message: diagnostic ?? entry.message,
      diagnostic,
    };
  }

  if (pinKind === "network" || pinKind === "provider") {
    const entry = TRANSACTION_ERROR_CATALOG.pin_failed;
    return {
      ...entry,
      message: diagnostic ?? entry.message,
      diagnostic,
    };
  }

  const mapped = mapTransactionError(error);
  if (mapped.code === "pin_config_error") {
    const raw = diagnostic ?? mapped.message;
    const message = /retrying will not help/i.test(raw)
      ? raw
      : `${raw} Retrying will not help until the server is configured.`;
    return {
      ...mapped,
      message,
    };
  }

  if (
    diagnostic &&
    /scheme alone is not enough|must be a valid ipfs:\/\/|required|exceeds/i.test(
      diagnostic,
    )
  ) {
    const entry = TRANSACTION_ERROR_CATALOG.pin_validation_error;
    return {
      ...entry,
      message: diagnostic,
      diagnostic,
    };
  }

  const entry = TRANSACTION_ERROR_CATALOG.pin_failed;
  return {
    ...entry,
    message: diagnostic ?? entry.message,
    diagnostic,
  };
}

/**
 * Map a community deployment / factory transaction error to a catalog-backed
 * plain-language message without leaking raw XDR or RPC stack traces.
 */
export function describeDeploymentError(error: unknown): MappedTransactionError {
  const mapped = mapTransactionError(error);
  if (mapped.code === "wallet_rejected") {
    return {
      ...mapped,
      message:
        "Wallet approval was declined. Your draft and simulation are preserved so you can review and try again.",
    };
  }
  if (
    mapped.code === "insufficient_balance" ||
    mapped.code === "resource_limit_exceeded"
  ) {
    return {
      ...mapped,
      message:
        "Simulation found insufficient transaction resources. No wallet signature was requested.",
    };
  }
  if (mapped.code === "expired_or_stale_tx") {
    return {
      ...mapped,
      message:
        "The unsigned or rejected transaction expired or used a stale sequence. Rebuild it from the current draft to load a fresh sequence, timeout, and resource footprint; a new signature will be required.",
    };
  }
  return mapped;
}
