import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const COOKIE = "uc8_device";
const secret = () => process.env.DEVICE_SECRET || "development-only-change-me";
const sign = (id: string) => createHmac("sha256", secret()).update(id).digest("hex");

export function deviceId(req: NextRequest, res: NextResponse) {
  const value = req.cookies.get(COOKIE)?.value;
  if (value) {
    const [id, signature] = value.split(".");
    if (id && signature) {
      const expected = sign(id);
      if (signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return id;
    }
  }
  const id = randomUUID();
  res.cookies.set(COOKIE, `${id}.${sign(id)}`, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365, path: "/" });
  return id;
}

const attempts = new Map<string, number[]>();
export function rateLimit(id: string, key: string, max: number, windowMs: number) {
  const now = Date.now();
  const token = `${id}:${key}`;
  const recent = (attempts.get(token) || []).filter((time) => now - time < windowMs);
  recent.push(now); attempts.set(token, recent);
  return recent.length <= max;
}
