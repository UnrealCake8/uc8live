import { z } from 'zod'
import { adminDb } from '../db/admin'
import { createMuxLiveStream, deleteMuxLiveStream, getMuxLiveStream, resetMuxStreamKey, setMuxStreamEnabled, RTMPS_SERVER_URL } from '../mux/live-streams'
import type { Visibility } from '../db/types'

export const channelInput=z.object({slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(63),title:z.string().trim().min(3).max(100),description:z.string().trim().max(2000).default(''),category:z.string().trim().min(2).max(50),thumbnailUrl:z.url().nullable().default(null),visibility:z.enum(['public','unlisted']).default('public')})
export type ChannelInput=z.infer<typeof channelInput>
export interface ChannelDependencies { db:ReturnType<typeof adminDb>; mux:{create:typeof createMuxLiveStream;remove:typeof deleteMuxLiveStream} }
const dependencies=():ChannelDependencies=>({db:adminDb(),mux:{create:createMuxLiveStream,remove:deleteMuxLiveStream}})
export async function createChannel(ownerId:string,input:ChannelInput,deps=dependencies()){
  const value=channelInput.parse(input); const {data:existing}=await deps.db.from('live_channels').select('id').eq('owner_id',ownerId).maybeSingle();
  if(existing)throw new Error('DUPLICATE_CHANNEL')
  const stream=await deps.mux.create(); const playbackId=stream.playback_ids?.[0]?.id
  if(!playbackId){await deps.mux.remove(stream.id).catch(()=>undefined);throw new Error('MUX_PLAYBACK_MISSING')}
  const {data,error}=await deps.db.from('live_channels').insert({owner_id:ownerId,slug:value.slug,title:value.title,description:value.description,category:value.category,thumbnail_url:value.thumbnailUrl,visibility:value.visibility,mux_live_stream_id:stream.id,mux_playback_id:playbackId,mux_stream_status:'disabled',is_enabled:false}).select().single()
  if(error){await deps.mux.remove(stream.id).catch(()=>undefined);throw new Error('CHANNEL_SAVE_FAILED')}
  return data
}
export async function getOwnerChannel(ownerId:string){const {data}=await adminDb().from('live_channels').select('*').eq('owner_id',ownerId).maybeSingle();return data}
async function requireAgeVerified(ownerId:string){const {data}=await adminDb().from('profiles').select('age_verified_at').eq('id',ownerId).single();if(!data?.age_verified_at)throw Response.json({error:'You must verify that you are at least 18 before streaming.'},{status:403})}
export async function getStreamCredentials(ownerId:string,recentAuth:boolean){if(!recentAuth)throw new Response('Recent authentication required',{status:403});await requireAgeVerified(ownerId);const channel=await getOwnerChannel(ownerId);if(!channel)throw new Response('Channel not found',{status:404});const stream=await getMuxLiveStream(channel.mux_live_stream_id);return {serverUrl:RTMPS_SERVER_URL,streamKey:stream.stream_key,status:channel.mux_stream_status}}
export async function regenerateStreamKey(ownerId:string,recentAuth:boolean){if(!recentAuth)throw new Response('Recent authentication required',{status:403});await requireAgeVerified(ownerId);const channel=await getOwnerChannel(ownerId);if(!channel)throw new Response('Channel not found',{status:404});const stream=await resetMuxStreamKey(channel.mux_live_stream_id);return {streamKey:stream.stream_key}}
export async function enableChannel(ownerId:string,enabled:boolean){if(enabled)await requireAgeVerified(ownerId);const channel=await getOwnerChannel(ownerId);if(!channel)throw new Response('Channel not found',{status:404});await setMuxStreamEnabled(channel.mux_live_stream_id,enabled);await adminDb().from('live_channels').update({is_enabled:enabled,mux_stream_status:enabled?'offline':'disabled'}).eq('id',channel.id)}
export function isLiveDirectoryChannel(channel:{mux_stream_status:string;is_enabled?:boolean}){return channel.mux_stream_status==='live'}
export async function listDirectory(){const db=adminDb();const {data:channels}=await db.from('live_channels').select('*').eq('visibility','public').order('updated_at',{ascending:false});const {data:replays}=await db.from('broadcasts').select('*').eq('is_replay_public',true).eq('status','ready').order('ended_at',{ascending:false}).limit(12);return {live:(channels??[]).filter(isLiveDirectoryChannel),replays:replays??[]}}
export function mayView(visibility:Visibility,viewerId:string|undefined,ownerId:string){return visibility!=='private'||viewerId===ownerId}
