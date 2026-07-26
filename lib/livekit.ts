import { AccessToken } from "livekit-server-sdk";

export async function createToken(identity: string, canPublish: boolean, room: string) {
  const key = process.env.LIVEKIT_API_KEY;
  const secret = process.env.LIVEKIT_API_SECRET;
  if (!key || !secret) throw new Error("LiveKit is not configured");
  const token = new AccessToken(key, secret, { identity, ttl: "2h" });
  token.addGrant({ roomJoin: true, room: `uc8-${room}`, canPublish, canSubscribe: true, canPublishData: false });
  return token.toJwt();
}
