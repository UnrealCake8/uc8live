import { muxClient } from './client'
export const RTMPS_SERVER_URL='rtmps://global-live.mux.com:443/app'
export async function createMuxLiveStream(){return muxClient().video.liveStreams.create({playback_policies:['public'],new_asset_settings:{playback_policies:['public']},reconnect_window:60,latency_mode:'reduced'})}
export async function deleteMuxLiveStream(id:string){await muxClient().video.liveStreams.delete(id)}
export async function getMuxLiveStream(id:string){return muxClient().video.liveStreams.retrieve(id)}
export async function resetMuxStreamKey(id:string){return muxClient().video.liveStreams.resetStreamKey(id)}
export async function setMuxStreamEnabled(id:string,enabled:boolean){return enabled?muxClient().video.liveStreams.enable(id):muxClient().video.liveStreams.disable(id)}
