import { NextResponse } from "next/server";
import { WebhookReceiver } from "livekit-server-sdk";
import { ensureRoomEgress, finishSession } from "@/lib/egress";
import { streamSessions } from "@/lib/stream-sessions";

export async function POST(request: Request) {
  const key = process.env.LIVEKIT_API_KEY; const secret = process.env.LIVEKIT_API_SECRET;
  if (!key || !secret) return NextResponse.json({ error: "Webhook unavailable" }, { status: 503 });
  const body = await request.text();
  try {
    const event = await new WebhookReceiver(key, secret).receive(body, request.headers.get("authorization") || undefined);
    const roomName = event.room?.name;
    const slug = roomName?.startsWith("uc8-") ? roomName.slice(4) : null;
    if (event.event === "track_published" && slug && event.participant?.permission?.canPublish) await ensureRoomEgress(slug);
    if (event.event === "room_finished" && slug) await finishSession(slug);
    if ((event.event === "egress_started" || event.event === "egress_updated") && event.egressInfo?.egressId) {
      const session = await streamSessions.getByEgress(event.egressInfo.egressId);
      if (session && session.status === "starting") { session.status = "live"; await streamSessions.save(session); }
    }
    if (event.event === "egress_ended" && event.egressInfo?.egressId) {
      const session = await streamSessions.getByEgress(event.egressInfo.egressId);
      if (session && session.status !== "ended" && session.status !== "ending") {
        session.deliveryMode = "webrtc"; session.status = "live"; session.egressId = null; session.hlsPlaybackUrl = null; session.hlsOutputPath = null;
        await streamSessions.save(session);
      }
    }
    return new NextResponse(null, { status: 204 });
  } catch { return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 }); }
}
