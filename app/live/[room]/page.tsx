import { notFound } from "next/navigation";
import { Viewer } from "@/components/Viewer";
import { getRoom } from "@/lib/rooms";

export const dynamic = "force-dynamic";

export default async function RoomPage({ params }: { params: { room: string } }) {
  const room = await getRoom(params.room);
  if (!room) notFound();
  return <Viewer room={room} />;
}
