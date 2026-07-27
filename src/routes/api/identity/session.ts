import { createFileRoute } from '@tanstack/react-router'
import { requireUser } from '@/server/auth/require-user'
import { createVerificationSession,getVerificationStatus } from '@/server/didit/verification'

export const Route=createFileRoute('/api/identity/session')({server:{handlers:{
  GET:async()=>{try{return Response.json(await getVerificationStatus((await requireUser()).id))}catch(error){if(error instanceof Response)return error;return Response.json({error:'Unable to load verification status'},{status:500})}},
  POST:async()=>{try{return Response.json(await createVerificationSession((await requireUser()).id),{status:201})}catch(error){if(error instanceof Response)return error;console.error('Didit session creation failed',error instanceof Error?error.message:'unknown error');return Response.json({error:'Unable to start identity verification'},{status:502})}},
}}})
