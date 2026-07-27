import { z } from 'zod'
import { muxClient } from './client'
import { env } from '../env'
import { adminDb } from '../db/admin'

const eventSchema=z.object({id:z.string().min(1),type:z.string().min(1),data:z.record(z.string(),z.unknown())})
const liveStatus:Record<string,'connecting'|'live'|'offline'|'reconnecting'|'disabled'>={'video.live_stream.connected':'connecting','video.live_stream.recording':'connecting','video.live_stream.active':'live','video.live_stream.idle':'offline','video.live_stream.disconnected':'reconnecting','video.live_stream.disabled':'disabled'}
export async function verifyMuxWebhook(body:string,signature:string){return eventSchema.parse(await muxClient().webhooks.unwrap(body,new Headers({'mux-signature':signature}),env().MUX_WEBHOOK_SECRET))}
export async function processMuxWebhook(event:z.infer<typeof eventSchema>){
  const db=adminDb();const {error:insertError}=await db.from('mux_webhook_events').insert({mux_event_id:event.id,event_type:event.type,payload:event,processing_status:'processing'})
  if(insertError?.code==='23505')return {duplicate:true};if(insertError)throw new Error('Unable to persist webhook event')
  try{
    const streamId=typeof event.data.id==='string'?event.data.id:typeof event.data.live_stream_id==='string'?event.data.live_stream_id:undefined
    if(streamId&&liveStatus[event.type])await db.from('live_channels').update({mux_stream_status:liveStatus[event.type]}).eq('mux_live_stream_id',streamId)
    if(event.type==='video.live_stream.active'&&streamId){const {data:channel}=await db.from('live_channels').select('*').eq('mux_live_stream_id',streamId).maybeSingle();if(channel)await db.from('broadcasts').insert({channel_id:channel.id,title:channel.title,status:'live',started_at:new Date().toISOString()})}
    if(event.type==='video.live_stream.idle'&&streamId){const {data:channel}=await db.from('live_channels').select('*').eq('mux_live_stream_id',streamId).maybeSingle();if(channel)await db.from('broadcasts').update({status:'processing',ended_at:new Date().toISOString()}).eq('channel_id',channel.id).eq('status','live')}
    if((event.type==='video.asset.created'||event.type==='video.asset.ready'||event.type==='video.asset.errored')&&typeof event.data.id==='string'){const assetId=event.data.id;const liveId=typeof event.data.live_stream_id==='string'?event.data.live_stream_id:undefined;if(liveId){const {data:channel}=await db.from('live_channels').select('*').eq('mux_live_stream_id',liveId).maybeSingle();const playback=Array.isArray(event.data.playback_ids)?(event.data.playback_ids[0] as {id?:string}|undefined)?.id:null;if(channel)await db.from('broadcasts').update({mux_asset_id:assetId,mux_playback_id:playback??null,status:event.type.endsWith('ready')?'ready':event.type.endsWith('errored')?'error':'processing',duration_seconds:typeof event.data.duration==='number'?Math.round(event.data.duration):null}).eq('channel_id',channel.id).in('status',['live','processing']) }}
    await db.from('mux_webhook_events').update({processing_status:'processed',processed_at:new Date().toISOString()}).eq('mux_event_id',event.id);return {duplicate:false}
  }catch(error){await db.from('mux_webhook_events').update({processing_status:'failed',error_message:error instanceof Error?error.message:'Webhook processing failed'}).eq('mux_event_id',event.id);throw error}
}
