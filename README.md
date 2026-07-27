# uc8Live

uc8Live is a lightweight, multi-room LiveKit application. Creators publish over LiveKit WebRTC; unauthenticated viewers use CDN-delivered HLS when configured and retain the subscribe-only WebRTC flow as a fallback. Chat, viewer accounts, creator registration, and creator-code issuance are intentionally out of scope.

## Creator flows

At `/creator/live`, **Start Room** is selected by default. It submits the normalized room name, manually issued creator code, and the explicit `create` action. The server validates the code, rejects an already-active room, creates a stream session, and issues a publish/subscribe token whose safe metadata role is `host`.

**Join Room** submits `join`. After the same server-side code checks, the server confirms the LiveKit room exists *before* issuing a publish/subscribe token with role `guest_creator`. Joining never starts egress and a valid join is not a violation. Invalid, malformed, revoked (`REVOKED_CREATOR_CODES`), and suspended (`SUSPENDED_CREATOR_CODES`) uses are recorded by the existing server-side violation boundary with `create_room` or `join_room` context. Codes are never put in identities, metadata, URLs, storage, logs, or responses.

Viewers need no account or authentication. Viewer WebRTC tokens are subscribe-only, cannot publish data, and are requested only when status selects WebRTC.

## HLS architecture

The first usable creator track triggers one **LiveKit room-composite egress** using the built-in `grid` layout. This includes publishers in a useful multi-creator composition while ordinary subscribe-only viewers do not appear. It writes segmented HLS to a supported S3-compatible origin:

```
live/{normalized-room}/{random-stream-session-id}/index.m3u8
live/{normalized-room}/{random-stream-session-id}/segment...
```

Object paths use the already validated normalized slug, never arbitrary client paths. Egress credentials remain server-side. Bunny is only the public CDN: configure a Bunny **Pull Zone** whose origin points to the origin bucket/public gateway. Bunny Storage is not assumed to be S3-compatible and Bunny Stream is not used. The playback URL is either:

```
${BUNNY_CDN_BASE_URL}/live/{room}/{session}/index.m3u8
```

or, when Bunny is disabled, the same safe path below `HLS_ORIGIN_PUBLIC_BASE_URL`.

### Environment

```dotenv
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
NEXT_PUBLIC_LIVEKIT_URL=wss://project.livekit.cloud
CREATOR_CODES=
REVOKED_CREATOR_CODES=
SUSPENDED_CREATOR_CODES=
DEVICE_SECRET=
HLS_ENABLED=false
HLS_ORIGIN_ENDPOINT=
HLS_ORIGIN_REGION=
HLS_ORIGIN_BUCKET=
HLS_ORIGIN_ACCESS_KEY=
HLS_ORIGIN_SECRET_KEY=
HLS_ORIGIN_PUBLIC_BASE_URL=
BUNNY_CDN_ENABLED=false
BUNNY_CDN_BASE_URL=
HLS_MAX_CONCURRENT_STREAMS=2
HLS_MAX_DURATION_MINUTES=180
HLS_FALLBACK_TO_WEBRTC=true
```

HLS is enabled only when `HLS_ENABLED` is exactly `true` and required storage/playback settings exist. If `BUNNY_CDN_ENABLED` is not exactly `true`, playback uses the origin public base URL. Configure the LiveKit webhook URL as `/api/livekit/webhook`; official SDK signature and payload-digest verification rejects forged events.

## Origin and Bunny setup

1. Create an origin bucket supported by LiveKit Egress's S3 output and provision least-privilege object-write credentials.
2. Configure its endpoint, region, bucket, access key, secret, and a browser-readable public (or authenticated gateway) base URL. Do not use Bunny Storage unless an independently supported S3-compatible origin is in front of it.
3. Create a Bunny Pull Zone pointing to that HLS origin; optionally attach a custom hostname and set `BUNNY_CDN_BASE_URL`.
4. Serve `.m3u8` as `application/vnd.apple.mpegurl` (or `application/x-mpegURL`) and `.ts` as `video/mp2t` (and fMP4 as `video/mp4` if enabled).
5. Allow `GET`, `HEAD`, and the uc8Live web origin with appropriate CORS response headers.
6. Use a short cache for a master playlist, a very short/no-cache policy for the changing live media playlist, and a longer immutable cache for uniquely named segments. Never aggressively cache a live playlist.
7. Check the account's LiveKit Egress quota. One active room consumes one composite egress; joined creators and viewers create none.

## Lifecycle and fallback

`StreamSessionStore` tracks `starting`, `live`, `ending`, `ended`, or `failed`, delivery mode, safe paths/URL, egress ID, and timestamps. This repository has no shared database, so the included global in-memory implementation is **development-only and not safe for multi-instance production**. Replace the interface with durable shared storage before scaling. The duration timer has the same single-process limitation.

HLS starts asynchronously after creator media is published, so the studio is never blocked. Duplicate starts are guarded by the session egress ID and the concurrent-stream cap. Egress events mark readiness/fallback; room completion stops egress and marks the session ended. At the duration cap, only HLS stops and the room continues in WebRTC mode. Files are retained. On configuration, quota, or provider failure, creators remain connected and safe operational logs omit provider payloads and credentials. When `HLS_FALLBACK_TO_WEBRTC` is enabled (default), viewers transparently receive subscribe-only WebRTC. With HLS disabled—recommended for local development—no Egress API is called and existing behavior is preserved.

To stop an orphan manually, use LiveKit Cloud's Egress dashboard or `lk egress stop <egress-id>`, then reconcile/expire the session in the production session store. Do not expose an egress stop operation publicly.

## Manual verification

1. Copy `.env.example` to `.env.local`, configure LiveKit/code/device values, and start with `npm run dev`.
2. Start a unique room with a valid code; verify the host wording and camera/microphone publishing.
3. Try Start again and verify “That room is already live. Use Join Room instead.”
4. Join from a second device with a valid code; verify guest wording, mutual subscription, publishing, and a single Egress job.
5. Try Join for a missing room and verify “That room is not currently live.” Test invalid/revoked codes and confirm only those attempts enter the private violation store.
6. With HLS configured, publish media and watch status change from starting to HLS. Test native Safari and a browser using hls.js, mute/unmute, retry, full screen, PiP, orientation, and return-to-live.
7. In LiveKit's participants view, confirm the creators and one internal room-composite participant exist but each HLS browser does **not** add a viewer participant or request `/api/token` in DevTools.
8. Disable HLS or simulate Egress quota/storage failure; verify the creator remains connected and an unauthenticated viewer receives a subscribe-only WebRTC token.
9. End the LiveKit room and verify egress stops, public status becomes ended, and the viewer shows the ended state. Send a forged webhook and verify HTTP 401.

## Current limitations

The development session store/rate limiter and duration timers are process-local, manifest availability is inferred from a successful egress-running event rather than origin probing, and provider quota/cost depend on the LiveKit plan. Production needs shared persistence/locking (to make the duplicate guard atomic across instances), durable scheduling, origin monitoring, and an operator-managed origin/CDN. HLS playback is delayed by several seconds and does not claim sub-second latency. HLS files are not deleted automatically.
