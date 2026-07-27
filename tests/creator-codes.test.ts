import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { validateCreatorCode, violationCount } from "../lib/creator-codes";

describe("creator-code validation", () => {
  let before: number;
  beforeEach(() => { before = violationCount(); process.env.CREATOR_CODES = "UC8-VALID"; process.env.REVOKED_CREATOR_CODES = "UC8-REVOKED"; });
  afterEach(() => { delete process.env.CREATOR_CODES; delete process.env.REVOKED_CREATOR_CODES; });
  it("accepts create and join without recording a violation", () => {
    expect(validateCreatorCode("UC8-VALID", "device", "create_room")).toEqual({ valid: true });
    expect(validateCreatorCode("UC8-VALID", "device", "join_room")).toEqual({ valid: true });
    expect(violationCount()).toBe(before);
  });
  it("rejects invalid and revoked codes and retains genuine violation tracking", () => {
    expect(validateCreatorCode("NOPE", "device", "create_room")).toMatchObject({ valid: false, reason: "invalid" });
    expect(validateCreatorCode("UC8-REVOKED", "device", "join_room")).toMatchObject({ valid: false, reason: "revoked" });
    expect(violationCount()).toBe(before + 2);
  });
});
