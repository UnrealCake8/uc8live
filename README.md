# uc8Live

A lightweight, multi-room LiveKit streaming platform. Viewers can browse channels and join a stream without creating an account; invited creators choose a room and publish camera and microphone.

## Setup

1. Copy `.env.example` to `.env.local` and add a LiveKit project's WebSocket URL, API key, and API secret.
2. Set `CREATOR_CODES` to a comma-separated list of invite codes and `DEVICE_SECRET` to a long random value.
3. Run `npm install`, then `npm run dev`.

Visit `/creator/live` to broadcast and `/live/` to watch. Device identities use a signed, HTTP-only, year-long cookie; token requests are rate-limited server-side. For multi-instance production deployments, replace the in-memory limiter with Redis or another shared store.
