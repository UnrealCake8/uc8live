import { Browse } from "@/components/Browse";
import { getLiveRooms } from "@/lib/rooms";

export const dynamic = "force-dynamic";

export default async function LivePage() { return <Browse rooms={await getLiveRooms()} />; }
