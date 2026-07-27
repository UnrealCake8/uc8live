import { afterEach, describe, expect, it } from "vitest";
import { createSession, hlsConfigured, playbackBase } from "../lib/stream-sessions";

describe("HLS delivery configuration", () => {
  afterEach(() => { for (const key of ["HLS_ENABLED","HLS_ORIGIN_BUCKET","HLS_ORIGIN_ACCESS_KEY","HLS_ORIGIN_SECRET_KEY","HLS_ORIGIN_PUBLIC_BASE_URL","BUNNY_CDN_ENABLED","BUNNY_CDN_BASE_URL"]) delete process.env[key]; });
  it("preserves WebRTC when HLS is disabled", () => { expect(hlsConfigured()).toBe(false); expect(createSession("safe-room").deliveryMode).toBe("webrtc"); });
  it("uses origin when Bunny is disabled and CDN when enabled", () => {
    process.env.HLS_ORIGIN_PUBLIC_BASE_URL="https://origin.example/"; expect(playbackBase()).toBe("https://origin.example");
    process.env.BUNNY_CDN_ENABLED="true"; process.env.BUNNY_CDN_BASE_URL="https://cdn.example/"; expect(playbackBase()).toBe("https://cdn.example");
  });
  it("enables HLS only with server-side origin settings", () => {
    Object.assign(process.env,{HLS_ENABLED:"true",HLS_ORIGIN_BUCKET:"bucket",HLS_ORIGIN_ACCESS_KEY:"key",HLS_ORIGIN_SECRET_KEY:"secret",HLS_ORIGIN_PUBLIC_BASE_URL:"https://origin.example"});
    expect(hlsConfigured()).toBe(true); const session=createSession("safe-room"); expect(session.hlsPlaybackUrl).toBeNull(); expect(JSON.stringify(session)).not.toContain("secret");
  });
});
