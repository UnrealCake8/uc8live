import { EgressClient, S3Upload, SegmentedFileOutput, SegmentedFileProtocol } from "livekit-server-sdk";
import { hlsConfigured, playbackBase, streamSessions } from "./stream-sessions";

function client() {
  const url = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  const key = process.env.LIVEKIT_API_KEY;
  const secret = process.env.LIVEKIT_API_SECRET;
  if (!url || !key || !secret) throw new Error("LiveKit is not configured");
  return new EgressClient(url.replace(/^ws/, "http"), key, secret);
}

export async function ensureRoomEgress(room: string) {
  const session = await streamSessions.getByRoom(room);
  if (!session || session.egressId) return session;
  if (!hlsConfigured()) { session.status = "live"; session.deliveryMode = "webrtc"; await streamSessions.save(session); return session; }
  const max = Math.max(0, Number(process.env.HLS_MAX_CONCURRENT_STREAMS || 2));
  if ((await streamSessions.active()).filter((s) => s.egressId).length >= max) return fallback(session, "HLS capacity reached");
  const base = playbackBase();
  const prefix = `live/${room}/${session.id}`;
  try {
    const output = new SegmentedFileOutput({
      protocol: SegmentedFileProtocol.HLS_PROTOCOL,
      filenamePrefix: `${prefix}/segment`,
      playlistName: `${prefix}/index.m3u8`,
      livePlaylistName: `${prefix}/live.m3u8`,
      segmentDuration: 4,
      output: { case: "s3", value: new S3Upload({
        accessKey: process.env.HLS_ORIGIN_ACCESS_KEY!, secret: process.env.HLS_ORIGIN_SECRET_KEY!,
        region: process.env.HLS_ORIGIN_REGION || "auto", endpoint: process.env.HLS_ORIGIN_ENDPOINT || "",
        bucket: process.env.HLS_ORIGIN_BUCKET!, forcePathStyle: true,
      }) },
    });
    const info = await client().startRoomCompositeEgress(session.liveKitRoomName, output, { layout: "grid" });
    session.egressId = info.egressId;
    session.hlsOutputPath = `${prefix}/index.m3u8`;
    session.hlsPlaybackUrl = `${base}/${session.hlsOutputPath}`;
    await streamSessions.save(session);
    const duration = Math.max(1, Number(process.env.HLS_MAX_DURATION_MINUTES || 180)) * 60_000;
    setTimeout(() => stopForDuration(session.egressId!), duration).unref?.();
    return session;
  } catch (error) {
    console.error("Unable to start room HLS egress", error instanceof Error ? error.name : "provider error");
    return fallback(session, "HLS egress unavailable");
  }
}

async function fallback(session: NonNullable<Awaited<ReturnType<typeof streamSessions.getByRoom>>>, reason: string) {
  if (process.env.HLS_FALLBACK_TO_WEBRTC !== "false") {
    session.deliveryMode = "webrtc"; session.status = "live"; session.hlsOutputPath = null; session.hlsPlaybackUrl = null;
    await streamSessions.save(session); console.warn(reason); return session;
  }
  session.status = "failed"; await streamSessions.save(session); return session;
}

async function stopForDuration(id: string) {
  const session = await streamSessions.getByEgress(id); if (!session || session.egressId !== id) return;
  try { await client().stopEgress(id); } catch { console.warn("Unable to stop duration-limited egress"); }
  session.deliveryMode = "webrtc"; session.status = "live"; session.egressId = null; session.hlsPlaybackUrl = null; session.hlsOutputPath = null;
  await streamSessions.save(session);
}

export async function finishSession(room: string) {
  const session = await streamSessions.getByRoom(room); if (!session) return;
  session.status = "ending"; await streamSessions.save(session);
  if (session.egressId) try { await client().stopEgress(session.egressId); } catch { console.warn("Unable to stop ended-room egress"); }
  session.status = "ended"; session.endedAt = new Date().toISOString(); session.egressId = null; await streamSessions.save(session);
}
