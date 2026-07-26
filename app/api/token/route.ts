import { NextRequest, NextResponse } from "next/server";
import { deviceId, rateLimit } from "@/lib/device";
import { createToken } from "@/lib/livekit";
import { roomSlugs } from "@/lib/rooms";

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  const id = deviceId(req, res);
  if (!rateLimit(id, "token", 12, 60_000)) return NextResponse.json({ error: "Too many requests. Take a breather." }, { status: 429 });
  const { role, code, room = "late-afternoon" } = await req.json();
  if (typeof room !== "string" || !roomSlugs.has(room)) return NextResponse.json({ error: "That room doesn't exist." }, { status: 404 });
  const creator = role === "creator";
  if (creator) {
    const codes = (process.env.CREATOR_CODES || "").split(",").map((v) => v.trim()).filter(Boolean);
    if (!code || !codes.includes(code)) return NextResponse.json({ error: "That creator code isn't valid." }, { status: 401 });
  }
  try {
    const token = await createToken(`${creator ? "creator" : "viewer"}-${id.slice(0, 8)}`, creator, room);
    const body = NextResponse.json({ token, url: process.env.NEXT_PUBLIC_LIVEKIT_URL, identity: id.slice(0, 8) });
    const cookie = res.cookies.get("uc8_device"); if (cookie) body.cookies.set(cookie);
    return body;
  } catch {
    return NextResponse.json({ error: "The studio isn't configured yet. Add your LiveKit keys to .env." }, { status: 503 });
  }
}
