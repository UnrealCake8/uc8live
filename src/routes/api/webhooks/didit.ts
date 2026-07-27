import { createFileRoute } from '@tanstack/react-router'
import { env } from '@/server/env'
import { processDiditWebhook,verifyDiditSignature } from '@/server/didit/verification'

export const Route=createFileRoute('/api/webhooks/didit')({server:{handlers:{POST:async({request})=>{
  const signature=request.headers.get('x-signature-v2'); const timestamp=request.headers.get('x-timestamp')
  if(!signature||!timestamp)return new Response('Invalid signature',{status:401})
  let payload:unknown; try{payload=await request.json()}catch{return new Response('Invalid payload',{status:400})}
  if(!verifyDiditSignature(payload,signature.toLowerCase(),timestamp,env().DIDIT_WEBHOOK_SECRET))return new Response('Invalid signature',{status:401})
  try{await processDiditWebhook(payload);return new Response(null,{status:204})}catch(error){console.error('Didit webhook processing failed',error instanceof Error?error.message:'unknown error');return new Response('Webhook processing failed',{status:500})}
}}}})
