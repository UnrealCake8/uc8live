import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createToken } from "../lib/livekit";

function payload(jwt: string) { return JSON.parse(Buffer.from(jwt.split(".")[1], "base64url").toString()) as { video: { canPublish: boolean; canSubscribe: boolean; canPublishData: boolean }; metadata: string; sub: string }; }
describe("participant grants", () => {
  beforeEach(()=>{process.env.LIVEKIT_API_KEY="key";process.env.LIVEKIT_API_SECRET="a-secret-long-enough-for-hs256"});
  afterEach(()=>{delete process.env.LIVEKIT_API_KEY;delete process.env.LIVEKIT_API_SECRET});
  it.each(["host","guest_creator"] as const)("allows %s to publish and subscribe",async(role)=>{const p=payload(await createToken(`${role}-safe-id`,role,"room"));expect(p.video).toMatchObject({canPublish:true,canSubscribe:true,canPublishData:false});expect(p.metadata).toBe(JSON.stringify({uc8Role:role}));});
  it("keeps viewers subscribe-only",async()=>{const p=payload(await createToken("viewer-safe-id","viewer","room"));expect(p.video).toMatchObject({canPublish:false,canSubscribe:true,canPublishData:false});});
});
