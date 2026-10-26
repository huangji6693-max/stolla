import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CommunityAvatar } from "../CommunityAvatar";

describe("CommunityAvatar", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses fixed image dimensions and a decorative alt value", () => {
    render(
      <CommunityAvatar
        communityId={"ab".repeat(32)}
        name="Builders Guild"
        logo="https://example.test/logo.png"
      />,
    );
    const image = screen.getByRole("presentation");
    expect(image).toHaveAttribute("width", "48");
    expect(image).toHaveAttribute("height", "48");
  });

  it("replaces a broken logo with a deterministic initial fallback", () => {
    render(
      <CommunityAvatar
        communityId={"cd".repeat(32)}
        name="Civic DAO"
        logo="https://example.test/broken.png"
      />,
    );
    fireEvent.error(screen.getByRole("presentation"));
    expect(screen.queryByRole("presentation")).not.toBeInTheDocument();
    expect(screen.getByText("C")).toHaveAttribute("aria-hidden", "true");
  });

  it("fails over across configured IPFS gateways before falling back to the initial placeholder", () => {
    vi.stubEnv("NEXT_PUBLIC_IPFS_GATEWAY_URL", "https://primary.gateway.test/ipfs/");
    vi.stubEnv(
      "NEXT_PUBLIC_IPFS_FALLBACK_GATEWAYS",
      "https://backup-one.gateway.test/ipfs/,https://backup-two.gateway.test/ipfs",
    );

    render(
      <CommunityAvatar
        communityId={"ef".repeat(32)}
        name="Stellar Builders"
        logo="ipfs://bafybeigdyrzt"
      />,
    );

    const img = screen.getByRole("presentation");
    expect(img).toHaveAttribute(
      "src",
      "https://primary.gateway.test/ipfs/bafybeigdyrzt",
    );

    // Primary gateway fails -> fails over to backup-one
    fireEvent.error(img);
    expect(screen.getByRole("presentation")).toHaveAttribute(
      "src",
      "https://backup-one.gateway.test/ipfs/bafybeigdyrzt",
    );

    // First fallback fails -> fails over to backup-two
    fireEvent.error(screen.getByRole("presentation"));
    expect(screen.getByRole("presentation")).toHaveAttribute(
      "src",
      "https://backup-two.gateway.test/ipfs/bafybeigdyrzt",
    );

    // Final fallback fails -> renders placeholder initial without broken <img>
    fireEvent.error(screen.getByRole("presentation"));
    expect(screen.queryByRole("presentation")).not.toBeInTheDocument();
    expect(screen.getByText("S")).toHaveAttribute("aria-hidden", "true");
  });
});
