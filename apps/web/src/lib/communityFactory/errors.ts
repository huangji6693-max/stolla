import { mapTransactionError } from "@/lib/transactionErrors";

export type CommunityDeploymentErrorKind =
  | "configuration"
  | "network"
  | "simulation"
  | "wallet_rejection"
  | "wallet"
  | "rpc"
  | "contract"
  | "submission"
  | "unknown";

export class CommunityDeploymentError extends Error {
  constructor(
    public readonly kind: CommunityDeploymentErrorKind,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "CommunityDeploymentError";
  }
}

export function toCommunityDeploymentError(
  error: unknown,
  fallbackKind: CommunityDeploymentErrorKind,
): CommunityDeploymentError {
  if (error instanceof CommunityDeploymentError) return error;

  const message = error instanceof Error ? error.message : String(error ?? "");
  const lower = message.toLowerCase();
  const mapped = mapTransactionError(error);

  if (
    mapped.code === "wallet_rejected" ||
    lower.includes("user rejected") ||
    lower.includes("user declined") ||
    lower.includes("rejected by user") ||
    lower.includes("closed the modal") ||
    lower.includes("request rejected")
  ) {
    return new CommunityDeploymentError(
      "wallet_rejection",
      "Wallet authorization was rejected. Your community details are still here.",
      error,
    );
  }

  if (
    mapped.code === "wrong_network" ||
    (lower.includes("network") && lower.includes("passphrase"))
  ) {
    return new CommunityDeploymentError(
      "network",
      "Wallet network does not match the configured Stellar network.",
      error,
    );
  }

  if (
    mapped.category === "simulation_failed" ||
    lower.includes("simulate") ||
    lower.includes("simulation")
  ) {
    return new CommunityDeploymentError("simulation", mapped.message, error);
  }

  if (
    mapped.category === "rpc_unavailable" ||
    lower.includes("host") ||
    lower.includes("rpc") ||
    lower.includes("fetch")
  ) {
    return new CommunityDeploymentError(
      "rpc",
      TRANSACTION_ERROR_RPC_FALLBACK(mapped.message),
      error,
    );
  }

  if (
    mapped.category === "contract_error" ||
    lower.includes("contract") ||
    lower.includes("error(") ||
    lower.includes("panic")
  ) {
    return new CommunityDeploymentError("contract", mapped.message, error);
  }

  return new CommunityDeploymentError(
    fallbackKind,
    mapped.code === "unknown"
      ? message || "Community deployment failed."
      : mapped.message,
    error,
  );
}

function TRANSACTION_ERROR_RPC_FALLBACK(message: string): string {
  return message;
}
