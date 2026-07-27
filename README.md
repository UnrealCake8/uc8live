# uc8Live

uc8Live is a production-oriented, one-to-many livestreaming application built with TanStack Start, React, TypeScript, Tailwind CSS, Supabase, and Mux Video. Creators publish with OBS over RTMPS; viewers receive adaptive live and recorded video through Mux Player.

## Architecture

- **TanStack Start** owns routing, SSR, API routes, and the server runtime. Public pages never import Mux management code.
- **Supabase Auth** supports email/password and Google OAuth. The database stores profiles, channels, broadcasts, and an idempotent Mux event ledger. RLS is defense in depth; privileged server operations use the service-role client only after server authentication and role checks.
- **Mux Video** owns RTMPS ingest, scalable playback, and automatic recordings. The server stores live-stream and playback identifiers, but never persists stream keys. Keys are fetched from Mux only for an authenticated owner with a recent sign-in.
- **Mux webhooks** are signature-verified before validated events update channel/broadcast state. `/live` trusts this verified state—not a creator toggle.
- The `BroadcastProvider` interface is an extension point for a future managed WebRTC bridge. It is intentionally separate from Mux playback and recording.

## Local development

Requirements: Node 22.12 or newer, npm, a Supabase project, and a Mux account.

```bash
npm install
cp .env.example .env
npm run dev
```

Run the quality suite with `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.

## Supabase setup

1. Create a Supabase project and copy its project URL, anonymous key, and service-role key.
2. Run `supabase/migrations/202607270001_mux_livestreaming.sql` with the Supabase CLI (`supabase db push`) or SQL editor.
3. Enable email/password authentication. Optionally configure the Google provider and add `${APP_URL}/creator` to allowed redirect URLs.
4. The migration creates new users as creators automatically, validates URL-safe unique usernames, and enables RLS. No application or creator code is required.
5. Generate refreshed types with `supabase gen types typescript --project-id <id> > src/server/db/types.ts` after changing the schema.

## Mux setup

1. In Mux, create an API access token with **Mux Video Read and Write** permission. Set `MUX_TOKEN_ID` and `MUX_TOKEN_SECRET` only in the server environment.
2. Create a webhook pointing to `https://your-domain.example/api/webhooks/mux` and store its signing secret as `MUX_WEBHOOK_SECRET`.
3. Subscribe to the current Mux events handled by this app: `video.live_stream.connected`, `video.live_stream.recording`, `video.live_stream.active`, `video.live_stream.idle`, `video.live_stream.disconnected`, `video.live_stream.disabled`, `video.asset.created`, `video.asset.ready`, and `video.asset.errored`. Recording assets are related using their `live_stream_id`.
4. Public and unlisted channels use public playback policies. Private creation is disabled in the UI until signed playback is fully configured and authorized.

## Environment variables

Copy `.env.example`; it deliberately contains names and blank values only.

| Variable | Initial public release | Purpose |
| --- | --- | --- |
| `SUPABASE_URL` | Required | Supabase project URL |
| `SUPABASE_ANON_KEY` | Required | Browser-safe authentication key |
| `SUPABASE_SERVICE_ROLE_KEY` | Required, server only | Privileged server database access |
| `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET` | Required, server only | Mux management API |
| `MUX_WEBHOOK_SECRET` | Required, server only | Webhook verification |
| `APP_URL` | Required | Canonical application URL |
| `MUX_SIGNING_KEY_ID` / `MUX_SIGNING_PRIVATE_KEY` | Optional initially | Server-generated signed playback tokens for a future private-stream rollout |

Never prefix service-role, Mux management, signing, or webhook secrets with `VITE_`. Production deploys should fail clearly when required values are absent.

## OBS setup

After creating a channel, open **Creator Hub → Stream Settings**, reauthenticate if requested, and reveal the details:

1. Open OBS Settings.
2. Select Stream.
3. Choose Custom service.
4. Paste the uc8Live RTMPS server URL.
5. Paste the private stream key.
6. Apply settings.
7. Press Start Streaming.
8. Return to uc8Live and wait for the verified status to become Live.

Use H.264 video, AAC audio, constant bitrate, and a two-second keyframe interval. Select an appropriate 720p or 1080p bitrate based on available upload bandwidth rather than treating one bitrate as mandatory.

## Deployment

Deploy the TanStack Start server output to a Node-compatible host, inject all required variables through its secret manager, set `APP_URL`, run the migration before serving traffic, then configure the public HTTPS Mux webhook URL. Do not deploy as a static-only site: authentication enforcement, Mux calls, signing, and webhooks require the server runtime.

## Security notes

- Mux API credentials, service-role credentials, webhook secrets, signing keys, and stream keys are never sent in initial HTML or public channel payloads.
- Stream keys are fetched directly from Mux only after owner authorization and recent authentication; regeneration invalidates the prior key.
- Webhooks are verified with the official SDK, recorded by unique event ID, validated, and safely ignore unsupported event types.
- Public directory queries include only public channels; exact unlisted links work; private creation remains disabled until signed playback authorization is complete.
- If local persistence fails after Mux creates a live stream, the service attempts to delete the orphan.

## Browser broadcasting limitation

Browser camera broadcasting is **not included**. Mux does not accept direct WebRTC ingest, and a camera preview must not be presented as a live broadcast. uc8Live does not send MediaRecorder chunks to Mux or proxy an unreliable browser-to-RTMP hack. A future WebRTC provider or managed bridge can implement `BroadcastProvider`; Mux will remain responsible for playback and recording.
