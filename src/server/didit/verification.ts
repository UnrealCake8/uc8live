import { createHmac, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import { adminDb } from '../db/admin'
import { env } from '../env'
import type { VerificationStatus } from '../db/types'

const DIDIT_SESSIONS_URL = 'https://verification.didit.me/v3/session/'
const responseSchema = z.object({ session_id:z.string().min(1), verification_url:z.url(), status:z.string() })
const webhookSchema = z.object({
  session_id:z.string().min(1), vendor_data:z.string().uuid(), status:z.string(),
  decision:z.record(z.string(),z.unknown()).optional(),
}).passthrough()

export function canonicalJson(value:unknown):string {
  if(Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if(value && typeof value==='object') return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${canonicalJson((value as Record<string,unknown>)[key])}`).join(',')}}`
  return JSON.stringify(value)
}

export function verifyDiditSignature(payload:unknown,signature:string,timestamp:string,secret:string,now=Date.now()) {
  const parsedTimestamp=Number(timestamp)
  if(!Number.isFinite(parsedTimestamp)) return false
  const timestampMs=parsedTimestamp < 10_000_000_000 ? parsedTimestamp*1000 : parsedTimestamp
  if(Math.abs(now-timestampMs)>300_000 || !/^[a-f\d]{64}$/.test(signature)) return false
  const expected=createHmac('sha256',secret).update(canonicalJson(payload)).digest('hex')
  return timingSafeEqual(Buffer.from(expected,'hex'),Buffer.from(signature,'hex'))
}

export async function createVerificationSession(userId:string,dependencies?:{fetch?:typeof fetch;db?:any}) {
  const e=env(); const request=dependencies?.fetch??fetch; const db=dependencies?.db??adminDb()
  const {data:profile}=await db.from('profiles').select('age_verified_at').eq('id',userId).single()
  if(profile?.age_verified_at) throw new Response('Age is already verified',{status:409})
  const response=await request(DIDIT_SESSIONS_URL,{method:'POST',headers:{'x-api-key':e.DIDIT_API_KEY,'content-type':'application/json'},body:JSON.stringify({workflow_id:e.DIDIT_WORKFLOW_ID,callback:`${e.APP_URL.replace(/\/$/,'')}/creator/verification`,vendor_data:userId})})
  if(!response.ok) throw new Error(`DIDIT_SESSION_FAILED_${response.status}`)
  const session=responseSchema.parse(await response.json())
  const {error}=await db.from('identity_verification_sessions').insert({user_id:userId,provider_session_id:session.session_id,status:'not_started',provider_status:session.status})
  if(error) throw new Error('VERIFICATION_SESSION_SAVE_FAILED')
  await db.from('profiles').update({identity_verification_status:'not_started'}).eq('id',userId)
  return {sessionId:session.session_id,verificationUrl:session.verification_url,status:'not_started' as const}
}

export async function getVerificationStatus(userId:string,db:any=adminDb()) {
  const {data,error}=await db.from('profiles').select('identity_verification_status,age_verified_at').eq('id',userId).single()
  if(error||!data) throw new Error('PROFILE_NOT_FOUND')
  return {status:data.identity_verification_status,ageVerified:data.age_verified_at!==null,verifiedAt:data.age_verified_at}
}

function normalizeStatus(status:string,adult:boolean):VerificationStatus {
  const normalized=status.trim().toLowerCase().replace(/[_ ]+/g,'_')
  if(normalized==='approved') return adult?'approved':'declined'
  if(normalized==='in_review'||normalized==='pending') return 'in_review'
  if(normalized==='in_progress'||normalized==='not_started'||normalized==='declined'||normalized==='abandoned'||normalized==='expired') return normalized
  return 'error'
}

function dateOfBirth(payload:Record<string,unknown>) {
  const decision=(payload.decision&&typeof payload.decision==='object'?payload.decision:payload) as Record<string,unknown>
  const checks=Array.isArray(decision.id_verifications)?decision.id_verifications:[]
  for(const check of checks) if(check&&typeof check==='object') {
    const value=(check as Record<string,unknown>).date_of_birth ?? (check as Record<string,unknown>).date_of_birth_parsed
    if(typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  }
}

export function ageOn(date:string,now=new Date()) {
  const [year,month,day]=date.split('-').map(Number); let age=now.getUTCFullYear()-year
  if(now.getUTCMonth()+1<month||(now.getUTCMonth()+1===month&&now.getUTCDate()<day)) age--
  return age
}

export async function processDiditWebhook(input:unknown,db:any=adminDb()) {
  const payload=webhookSchema.parse(input); const dob=dateOfBirth(payload); const age=dob?ageOn(dob):null
  const approved=payload.status.trim().toLowerCase()==='approved'; const status=normalizeStatus(payload.status,approved&&age!==null&&age>=18)
  const {data:session,error:sessionError}=await db.from('identity_verification_sessions').select('user_id').eq('provider_session_id',payload.session_id).eq('user_id',payload.vendor_data).single()
  if(sessionError||!session) throw new Error('UNKNOWN_VERIFICATION_SESSION')
  const {data:event,error:eventError}=await db.from('didit_webhook_events').insert({provider_session_id:payload.session_id,payload}).select('id').single()
  if(eventError) throw new Error('WEBHOOK_EVENT_SAVE_FAILED')
  const completed=['approved','declined','abandoned','expired'].includes(status)?new Date().toISOString():null
  const {error:updateError}=await db.from('identity_verification_sessions').update({status,age,provider_status:payload.status,updated_at:new Date().toISOString(),completed_at:completed}).eq('provider_session_id',payload.session_id)
  if(updateError) throw new Error('VERIFICATION_UPDATE_FAILED')
  const profileUpdate:Record<string,unknown>={identity_verification_status:status}
  if(status==='approved') profileUpdate.age_verified_at=new Date().toISOString()
  const {data:profile}=await db.from('profiles').select('age_verified_at').eq('id',session.user_id).single()
  const {error:profileError}=profile?.age_verified_at && status!=='approved' ? {error:null} : await db.from('profiles').update(profileUpdate).eq('id',session.user_id)
  if(profileError) throw new Error('PROFILE_VERIFICATION_UPDATE_FAILED')
  await db.from('didit_webhook_events').update({processed_at:new Date().toISOString()}).eq('id',event.id)
}
