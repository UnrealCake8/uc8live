import { NextResponse } from "next/server";
import { roomExists } from "@/lib/rooms";
import { streamSessions } from "@/lib/stream-sessions";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { room: string } }) {
  if (!/^[a-z0-9][a-z0-9-]{1,62}$/.test(params.room)) return NextResponse.json({ status: "ended" }, { status: 404 });
  const session = await streamSessions.getByRoom(params.room);
  if (!session) return NextResponse.json({ status: await roomExists(params.room) ? "live" : "ended", deliveryMode: "webrtc", playbackUrl: null });
  return NextResponse.json({ status: session.status, deliveryMode: session.deliveryMode, playbackUrl: session.deliveryMode === "hls" ? session.hlsPlaybackUrl : null });
}
