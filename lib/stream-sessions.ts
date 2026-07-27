import { randomUUID } from "crypto";

export type StreamSession = {
  id: string;
  roomName: string;
  liveKitRoomName: string;
  status: "starting" | "live" | "ending" | "ended" | "failed";
  deliveryMode: "hls" | "webrtc";
  hlsOutputPath: string | null;
  hlsPlaybackUrl: string | null;
  egressId: string | null;
  startedAt: string;
  endedAt: string | null;
};

export interface StreamSessionStore {
  getByRoom(room: string): Promise<StreamSession | null>;
  getByEgress(egressId: string): Promise<StreamSession | null>;
  save(session: StreamSession): Promise<void>;
  active(): Promise<StreamSession[]>;
}

/** Development fallback only: replace with shared durable storage in multi-instance production. */
class MemoryStreamSessionStore implements StreamSessionStore {
  private sessions = new Map<string, StreamSession>();
  async getByRoom(room: string) { return this.sessions.get(room) || null; }
  async getByEgress(id: string) { return Array.from(this.sessions.values()).find((s) => s.egressId === id) || null; }
  async save(session: StreamSession) { this.sessions.set(session.roomName, session); }
  async active() { return Array.from(this.sessions.values()).filter((s) => s.status === "starting" || s.status === "live"); }
}

const globalStore = globalThis as typeof globalThis & { uc8Sessions?: MemoryStreamSessionStore };
export const streamSessions: StreamSessionStore = globalStore.uc8Sessions ||= new MemoryStreamSessionStore();

export function createSession(room: string): StreamSession {
  return { id: randomUUID(), roomName: room, liveKitRoomName: `uc8-${room}`, status: "starting", deliveryMode: hlsConfigured() ? "hls" : "webrtc", hlsOutputPath: null, hlsPlaybackUrl: null, egressId: null, startedAt: new Date().toISOString(), endedAt: null };
}

export function hlsConfigured() {
  return process.env.HLS_ENABLED === "true" && Boolean(process.env.HLS_ORIGIN_BUCKET && process.env.HLS_ORIGIN_ACCESS_KEY && process.env.HLS_ORIGIN_SECRET_KEY && playbackBase());
}

export function playbackBase() {
  const base = process.env.BUNNY_CDN_ENABLED === "true" ? process.env.BUNNY_CDN_BASE_URL : process.env.HLS_ORIGIN_PUBLIC_BASE_URL;
  return base?.replace(/\/+$/, "") || null;
}
