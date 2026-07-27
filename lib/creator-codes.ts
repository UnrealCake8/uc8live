export type CreatorCodeContext = "create_room" | "join_room";

export type CreatorCodeResult = { valid: true } | { valid: false; reason: "invalid" | "revoked" | "suspended" | "malformed" };

// This is deliberately server-only. Values and audit records never leave this module.
const violations: Array<{ deviceId: string; context: CreatorCodeContext; reason: string; at: string }> = [];

function values(name: string) {
  return new Set((process.env[name] || "").split(",").map((value) => value.trim()).filter(Boolean));
}

export function validateCreatorCode(code: unknown, deviceId: string, context: CreatorCodeContext): CreatorCodeResult {
  let result: CreatorCodeResult;
  if (typeof code !== "string" || code.length > 128 || !/^[A-Z0-9-]+$/.test(code)) result = { valid: false, reason: "malformed" };
  else if (values("REVOKED_CREATOR_CODES").has(code)) result = { valid: false, reason: "revoked" };
  else if (values("SUSPENDED_CREATOR_CODES").has(code)) result = { valid: false, reason: "suspended" };
  else if (!values("CREATOR_CODES").has(code)) result = { valid: false, reason: "invalid" };
  else result = { valid: true };

  // Valid use, including joining, is never a violation.
  if (!result.valid) violations.push({ deviceId, context, reason: result.reason, at: new Date().toISOString() });
  return result;
}

export function violationCount() { return violations.length; }
