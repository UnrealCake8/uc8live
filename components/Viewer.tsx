"use client";
import { useEffect, useState } from "react";
import { LiveKitRoom, RoomAudioRenderer, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";
import { ArrowLeft, Heart, Share2, Users } from "lucide-react";
import type { LiveRoom } from "@/lib/rooms";
import { SiteHeader } from "./SiteHeader";

export function Viewer({ room }: { room: LiveRoom }) {
 const [connection, setConnection] = useState<{token:string,url:string}|null>(null);
 const [error,setError]=useState(""); const [liked,setLiked]=useState(false);
 useEffect(()=>{setConnection(null);fetch("/api/token",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({role:"viewer",room:room.slug})}).then(r=>r.json()).then(d=>d.token?setConnection(d):setError(d.error));},[room.slug]);
 const initials=room.creator.split(/\s+/).map(word=>word[0]).join("").slice(0,2).toUpperCase();
 return <main className="viewerPage"><SiteHeader/><div className="roomShell"><a href="/live/" className="backBrowse"><ArrowLeft size={15}/> All live rooms</a><section className="watchLayout noChat"><div className="stageCard"><div className="videoStage liveArtwork">
  {connection ? <LiveKitRoom token={connection.token} serverUrl={connection.url} connect audio={false} video={false} className="room"><VideoConference/><RoomAudioRenderer/></LiveKitRoom> : <div className="videoPlaceholder"><div className="orb"/><p>{error||`Joining ${room.creator}…`}</p><small>{error||"Connecting securely"}</small></div>}
  <div className="liveBadge"><span/> LIVE</div><div className="stageMeta"><div className="avatar">{initials}</div><div><b>{room.creator}</b><p>{room.name}</p></div></div>
 </div><div className="belowStage"><span className="channelAvatar accent-0">{initials}</span><div><h1>{room.name}</h1><p><b>{room.creator}</b></p></div><span className="roomWatching"><Users size={16}/> {room.viewers} watching</span><button className={liked?"liked":""} onClick={()=>setLiked(!liked)}><Heart size={19} fill={liked?"currentColor":"none"}/>{liked?"Following":"Follow"}</button><button aria-label="Share room"><Share2 size={19}/></button></div></div></section></div><footer><span>© 2026 uc8Live</span><span>Real people. Right now.</span><span>Community guidelines · Privacy</span></footer></main>
}
