import { RoomServiceClient } from "livekit-server-sdk";

export type LiveRoom = {
  slug: string;
  name: string;
  creator: string;
  viewers: number;
};

function service() {
  const url = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  const key = process.env.LIVEKIT_API_KEY;
  const secret = process.env.LIVEKIT_API_SECRET;
  if (!url || !key || !secret) return null;
  return new RoomServiceClient(url.replace(/^ws/, "http"), key, secret);
}

function displayName(value: string) {
  return value.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export async function getLiveRooms(): Promise<LiveRoom[]> {
  const client = service();
  if (!client) return [];

  let activeRooms;
  try {
    activeRooms = await client.listRooms();
  } catch {
    return [];
  }
  return Promise.all(activeRooms
    .filter((room) => room.name.startsWith("uc8-") && room.numPublishers > 0)
    .map(async (room) => {
      const slug = room.name.slice(4);
      let metadata: { title?: string; creator?: string } = {};
      try { metadata = JSON.parse(room.metadata || "{}"); } catch { /* Ignore invalid external metadata. */ }
      const participants = await client.listParticipants(room.name);
      const publisher = participants.find((participant) => participant.permission?.canPublish);
      return {
        slug,
        name: metadata.title?.trim() || displayName(slug),
        creator: metadata.creator?.trim() || publisher?.name || publisher?.identity || displayName(slug),
        viewers: Math.max(0, room.numParticipants - room.numPublishers),
      };
    }));
}

export async function getRoom(slug: string) {
  return (await getLiveRooms()).find((room) => room.slug === slug);
}

export async function roomExists(slug: string) {
  const client = service();
  if (!client) return false;
  const rooms = await client.listRooms([`uc8-${slug}`]);
  return rooms.length > 0;
}
