import { NextRequest, NextResponse } from "next/server";
import { deviceId, rateLimit } from "@/lib/device";
import { createToken } from "@/lib/livekit";
import { roomExists } from "@/lib/rooms";
import { validateCreatorCode } from "@/lib/creator-codes";
import { createSession, streamSessions } from "@/lib/stream-sessions";

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  const id = deviceId(req, res);
  if (!rateLimit(id, "token", 12, 60_000)) return NextResponse.json({ error: "Too many requests. Take a breather." }, { status: 429 });
  let payload: unknown;
  try { payload = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const { role, action, code, room } = payload as Record<string, unknown>;
  if (typeof room !== "string" || !/^[a-z0-9][a-z0-9-]{1,62}$/.test(room)) return NextResponse.json({ error: "Enter a valid room name." }, { status: 400 });
  const creator = role === "creator";
  if (creator) {
    if (action !== "create" && action !== "join") return NextResponse.json({ error: "Choose Start Room or Join Room." }, { status: 400 });
    const validation = validateCreatorCode(code, id, action === "create" ? "create_room" : "join_room");
    if (!validation.valid) return NextResponse.json({ error: "That creator code isn't valid." }, { status: 401 });
    const exists = await roomExists(room);
    if (action === "create" && exists) return NextResponse.json({ error: "That room is already live. Use Join Room instead." }, { status: 409 });
    if (action === "join" && !exists) return NextResponse.json({ error: "That room is not currently live." }, { status: 404 });
    if (action === "create") {
      const current = await streamSessions.getByRoom(room);
      if (current && (current.status === "starting" || current.status === "live")) return NextResponse.json({ error: "That room is already live. Use Join Room instead." }, { status: 409 });
      await streamSessions.save(createSession(room));
    }
  }
  if (!creator && !(await roomExists(room))) return NextResponse.json({ error: "That broadcast has ended." }, { status: 404 });
  try {
    const participantRole = creator ? (action === "create" ? "host" : "guest_creator") : "viewer";
    const token = await createToken(`${participantRole}-${id.slice(0, 8)}-${crypto.randomUUID().slice(0, 8)}`, participantRole, room);
    const body = NextResponse.json({ token, url: process.env.NEXT_PUBLIC_LIVEKIT_URL, participantRole });
    const cookie = res.cookies.get("uc8_device"); if (cookie) body.cookies.set(cookie);
    return body;
  } catch {
    return NextResponse.json({ error: "The studio isn't configured yet. Add your LiveKit keys to .env." }, { status: 503 });
  }
}
