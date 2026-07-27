import { AccessToken } from "livekit-server-sdk";

export type ParticipantRole = "host" | "guest_creator" | "viewer";

export async function createToken(identity: string, role: ParticipantRole, room: string) {
  const key = process.env.LIVEKIT_API_KEY;
  const secret = process.env.LIVEKIT_API_SECRET;
  if (!key || !secret) throw new Error("LiveKit is not configured");
  const canPublish = role !== "viewer";
  const token = new AccessToken(key, secret, { identity, ttl: "2h", metadata: JSON.stringify({ uc8Role: role }) });
  token.addGrant({ roomJoin: true, room: `uc8-${room}`, canPublish, canPublishSources: canPublish ? undefined : [], canSubscribe: true, canPublishData: false });
  return token.toJwt();
}
