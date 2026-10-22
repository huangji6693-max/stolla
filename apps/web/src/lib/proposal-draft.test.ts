import { describe, expect, it, beforeEach } from "vitest";
import {
  clearProposalDraft,
  isEmptyProposalDraft,
  readProposalDraft,
  writeProposalDraft,
} from "./proposal-draft";
import type { ProposalMetadataDraft } from "@/lib/proposal-metadata";

const GOVERNOR_A = "CGOVERNORA";
const GOVERNOR_B = "CGOVERNORB";

const FILLED_DRAFT: ProposalMetadataDraft = {
  title: "Fund the grants program",
  summary: "Approve the community grants program.",
  body: "Fund reviewed grants from the community treasury.",
  discussionUrl: "https://forum.example.com/t/1",
};

const EMPTY_DRAFT: ProposalMetadataDraft = {
  title: "",
  summary: "",
  body: "",
  discussionUrl: null,
};

beforeEach(() => {
  localStorage.clear();
});

describe("isEmptyProposalDraft", () => {
  it("treats the all-blank draft as empty", () => {
    expect(isEmptyProposalDraft(EMPTY_DRAFT)).toBe(true);
  });

  it("treats whitespace-only fields as empty", () => {
    expect(
      isEmptyProposalDraft({ title: "   ", summary: "\n", body: "\t", discussionUrl: "  " }),
    ).toBe(true);
  });

  it("treats a draft with only a title filled in as non-empty", () => {
    expect(isEmptyProposalDraft({ ...EMPTY_DRAFT, title: "Draft title" })).toBe(false);
  });

  it("treats a draft with only a discussion URL filled in as non-empty", () => {
    expect(
      isEmptyProposalDraft({ ...EMPTY_DRAFT, discussionUrl: "https://example.com" }),
    ).toBe(false);
  });
});

describe("writeProposalDraft / readProposalDraft", () => {
  it("saves and restores a filled draft (the 'refresh restores fields' contract)", () => {
    writeProposalDraft(GOVERNOR_A, FILLED_DRAFT);
    expect(readProposalDraft(GOVERNOR_A)).toEqual(FILLED_DRAFT);
  });

  it("returns null when nothing has been saved", () => {
    expect(readProposalDraft(GOVERNOR_A)).toBeNull();
  });

  it("does not write an empty draft at all", () => {
    writeProposalDraft(GOVERNOR_A, EMPTY_DRAFT);
    expect(localStorage.getItem("stolla:proposal-draft:v1:" + GOVERNOR_A)).toBeNull();
  });

  it("clears a previously-saved draft when the draft becomes empty again", () => {
    writeProposalDraft(GOVERNOR_A, FILLED_DRAFT);
    writeProposalDraft(GOVERNOR_A, EMPTY_DRAFT);
    expect(readProposalDraft(GOVERNOR_A)).toBeNull();
  });

  it("scopes drafts per Governor contract so one does not clobber another", () => {
    const draftA: ProposalMetadataDraft = { ...FILLED_DRAFT, title: "Proposal for A" };
    const draftB: ProposalMetadataDraft = { ...FILLED_DRAFT, title: "Proposal for B" };
    writeProposalDraft(GOVERNOR_A, draftA);
    writeProposalDraft(GOVERNOR_B, draftB);
    expect(readProposalDraft(GOVERNOR_A)?.title).toBe("Proposal for A");
    expect(readProposalDraft(GOVERNOR_B)?.title).toBe("Proposal for B");
  });

  it("fails closed (null) on corrupted JSON rather than throwing", () => {
    localStorage.setItem("stolla:proposal-draft:v1:" + GOVERNOR_A, "{not json");
    expect(readProposalDraft(GOVERNOR_A)).toBeNull();
  });

  it("fails closed on a malformed shape (e.g. missing fields)", () => {
    localStorage.setItem(
      "stolla:proposal-draft:v1:" + GOVERNOR_A,
      JSON.stringify({ title: "only a title" }),
    );
    expect(readProposalDraft(GOVERNOR_A)).toBeNull();
  });
});

describe("clearProposalDraft", () => {
  it("removes a saved draft (the 'successful submit clears storage' contract)", () => {
    writeProposalDraft(GOVERNOR_A, FILLED_DRAFT);
    clearProposalDraft(GOVERNOR_A);
    expect(readProposalDraft(GOVERNOR_A)).toBeNull();
  });

  it("clearing one Governor's draft leaves another's untouched", () => {
    writeProposalDraft(GOVERNOR_A, FILLED_DRAFT);
    writeProposalDraft(GOVERNOR_B, FILLED_DRAFT);
    clearProposalDraft(GOVERNOR_A);
    expect(readProposalDraft(GOVERNOR_A)).toBeNull();
    expect(readProposalDraft(GOVERNOR_B)).toEqual(FILLED_DRAFT);
  });

  it("is a no-op when nothing was saved", () => {
    expect(() => clearProposalDraft(GOVERNOR_A)).not.toThrow();
  });
});
