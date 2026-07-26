import { notFound } from "next/navigation";
import { Viewer } from "@/components/Viewer";
import { getRoom } from "@/lib/rooms";

export default function RoomPage({ params }: { params: { room: string } }) {
  const room = getRoom(params.room);
  if (!room) notFound();
  return <Viewer room={room} />;
}
