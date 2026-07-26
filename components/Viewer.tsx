"use client";
import { useEffect, useState } from "react";
import { LiveKitRoom, RoomAudioRenderer, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";
import { ArrowLeft, Heart, Share2, Users } from "lucide-react";
import type { LiveRoom } from "@/lib/rooms";
import { rooms } from "@/lib/rooms";
import { SiteHeader } from "./SiteHeader";

export function Viewer({ room }: { room: LiveRoom }) {
 const [connection, setConnection] = useState<{token:string,url:string}|null>(null);
 const [error,setError]=useState(""); const [liked,setLiked]=useState(false);
 useEffect(()=>{setConnection(null);fetch("/api/token",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({role:"viewer",room:room.slug})}).then(r=>r.json()).then(d=>d.token?setConnection(d):setError(d.error));},[room.slug]);
 return <main className="viewerPage"><SiteHeader/><div className="roomShell"><a href="/live/" className="backBrowse"><ArrowLeft size={15}/> All live rooms</a><section className="watchLayout noChat"><div className="stageCard"><div className={`videoStage art-${room.accent}`}>
  {connection ? <LiveKitRoom token={connection.token} serverUrl={connection.url} connect audio video={false} className="room"><VideoConference/><RoomAudioRenderer/></LiveKitRoom> : <div className="videoPlaceholder"><div className="orb"/><p>{error||`Joining ${room.creator}…`}</p><small>{error?"Add your LiveKit credentials to start watching.":"Connecting securely"}</small></div>}
  <div className="liveBadge"><span/> LIVE</div><div className="stageMeta"><div className="avatar">{room.initials}</div><div><b>{room.creator}</b><p>{room.title}</p></div></div>
 </div><div className="belowStage"><span className={`channelAvatar ${room.accent}`}>{room.initials}</span><div><h1>{room.title}</h1><p><b>{room.creator}</b> · {room.category}</p></div><span className="roomWatching"><Users size={16}/> {room.viewers} watching</span><button className={liked?"liked":""} onClick={()=>setLiked(!liked)}><Heart size={19} fill={liked?"currentColor":"none"}/>{liked?"Following":"Follow"}</button><button aria-label="Share room"><Share2 size={19}/></button></div><div className="aboutRoom"><h2>About this stream</h2><p>{room.description}</p></div></div></section><section className="moreLive"><div className="sectionTitle"><div><span>KEEP WATCHING</span><h2>More live rooms</h2></div></div><div className="compactRooms">{rooms.filter(r=>r.slug!==room.slug).slice(0,4).map(r=><a href={`/live/${r.slug}`} key={r.slug}><span className={`compactArt art-${r.accent}`}>{r.initials}<i>LIVE</i></span><b>{r.title}</b><small>{r.creator} · {r.viewers} viewers</small></a>)}</div></section></div><footer><span>© 2026 uc8Live</span><span>Real people. Right now.</span><span>Community guidelines · Privacy</span></footer></main>
}
