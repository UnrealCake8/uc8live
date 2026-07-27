"use client";
import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";
import { Maximize, Pause, PictureInPicture, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";

export function HlsPlayer({ src, status }: { src: string; status: string }) {
  const video = useRef<HTMLVideoElement>(null); const [playing,setPlaying]=useState(false); const [muted,setMuted]=useState(true); const [error,setError]=useState(false);
  const attach = () => {
    const element=video.current; if(!element)return () => {};
    setError(false);
    if(element.canPlayType("application/vnd.apple.mpegurl")){element.src=src; element.play().catch(()=>{}); return()=>{element.removeAttribute("src");element.load()};}
    if(!Hls.isSupported()){setError(true);return()=>{}};
    const hls=new Hls({enableWorker:true,lowLatencyMode:false}); hls.loadSource(src);hls.attachMedia(element);
    hls.on(Hls.Events.MANIFEST_PARSED,()=>element.play().catch(()=>{}));
    hls.on(Hls.Events.ERROR,(_,data)=>{if(data.fatal){if(data.type===Hls.ErrorTypes.NETWORK_ERROR)hls.startLoad();else if(data.type===Hls.ErrorTypes.MEDIA_ERROR)hls.recoverMediaError();else{setError(true);hls.destroy()}}});
    return()=>hls.destroy();
  };
  useEffect(attach,[src]);
  const toggle=()=>{const v=video.current;if(!v)return;v.paused?v.play():v.pause()};
  if(status==="ended")return <div className="hlsState"><h2>This broadcast has ended.</h2><a href="/live/">Browse live rooms</a></div>;
  return <div className="hlsPlayer">{error&&<div className="hlsState"><p>Stream unavailable.</p><button onClick={attach}><RotateCcw size={16}/> Retry</button></div>}<video ref={video} playsInline muted={muted} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)}/><div className="hlsControls"><button onClick={toggle} aria-label={playing?"Pause":"Play"}>{playing?<Pause/>:<Play/>}</button><button onClick={()=>{if(video.current){video.current.muted=!muted;setMuted(!muted)}}} aria-label={muted?"Unmute":"Mute"}>{muted?<VolumeX/>:<Volume2/>}<span>{muted?"Unmute":"Mute"}</span></button><span className="hlsLive"><i/> LIVE</span><button className="returnLive" onClick={()=>{if(video.current)video.current.currentTime=video.current.duration}}>Return to live</button><button onClick={()=>video.current?.requestPictureInPicture?.()} aria-label="Picture in picture"><PictureInPicture/></button><button onClick={()=>video.current?.requestFullscreen()} aria-label="Fullscreen"><Maximize/></button></div></div>;
}
