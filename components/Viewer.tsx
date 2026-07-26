"use client";
import { useEffect, useState } from "react";
import { LiveKitRoom, RoomAudioRenderer, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";
import { Heart, MessageCircle, Send, Share2, Users } from "lucide-react";

type Comment = { name: string; text: string; color: string };
const seed: Comment[] = [{name:"maya",text:"the lighting is so good!",color:"#f6bc71"},{name:"noah",text:"Just got here 👋",color:"#b4d2ff"},{name:"liv",text:"this is such a vibe",color:"#d0a9ff"}];

export function Viewer() {
 const [connection, setConnection] = useState<{token:string,url:string}|null>(null); const [error,setError]=useState("");
 const [comments,setComments]=useState(seed); const [message,setMessage]=useState(""); const [liked,setLiked]=useState(false);
 useEffect(()=>{fetch("/api/token",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({role:"viewer"})}).then(r=>r.json()).then(d=>d.token?setConnection(d):setError(d.error));},[]);
 const send=()=>{const text=message.trim();if(!text)return;setComments(v=>[...v,{name:"guest",text,color:"#82e8c5"}]);setMessage("");};
 return <main className="viewerPage"><header><BrandInline/><div className="navActions"><span className="watching"><Users size={15}/> 1.2K watching</span><a className="creatorLink" href="/creator/live">Go live <span>→</span></a></div></header>
 <section className="watchLayout"><div className="stageCard"><div className="videoStage">
  {connection ? <LiveKitRoom token={connection.token} serverUrl={connection.url} connect audio video={false} className="room"><VideoConference/><RoomAudioRenderer/></LiveKitRoom> : <div className="videoPlaceholder"><div className="orb"/><p>{error||"Joining the live room…"}</p><small>{error?"The experience is ready for your LiveKit credentials.":"Connecting securely"}</small></div>}
  <div className="liveBadge"><span/> LIVE</div><div className="stageMeta"><div className="avatar">UC</div><div><b>uc8 studio</b><p>late afternoon hangout</p></div></div>
 </div><div className="belowStage"><div><h1>late afternoon hangout</h1><p>Just chatting, making things, seeing where the day goes.</p></div><button className={liked?"liked":""} onClick={()=>setLiked(!liked)}><Heart size={20} fill={liked?"currentColor":"none"}/>{liked?"2.9K":"2.8K"}</button><button><Share2 size={20}/></button></div></div>
 <aside className="chat"><div className="chatHead"><div><span className="pulse"/>Live chat</div><MessageCircle size={19}/></div><div className="messages">{comments.map((c,i)=><div className="comment" key={i}><span className="commentAvatar" style={{background:c.color}}>{c.name[0].toUpperCase()}</span><p><b>{c.name}</b><br/>{c.text}</p></div>)}</div><div className="chatInput"><input value={message} maxLength={180} onChange={e=>setMessage(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Say something nice…"/><button onClick={send}><Send size={17}/></button><small>Be kind. Your device is protected against spam.</small></div></aside></section>
 <footer><span>© 2026 uc8Live</span><span>Real people. Right now.</span><span>Community guidelines · Privacy</span></footer></main>
}
function BrandInline(){return <a href="/live/" className="brand"><span className="brandMark"><i/><i/><i/></span><b>uc8</b>Live</a>}
