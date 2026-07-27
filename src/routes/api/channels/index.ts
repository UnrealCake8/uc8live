import { createFileRoute } from '@tanstack/react-router'
import { requireRole } from '@/server/auth/require-role'
import { createChannel, listDirectory } from '@/server/channels/channel-service'
export const Route=createFileRoute('/api/channels/')({server:{handlers:{GET:async()=>Response.json(await listDirectory()),POST:async({request})=>{try{const {user}=await requireRole('creator');const channel=await createChannel(user.id,await request.json());return Response.json(channel,{status:201})}catch(error){if(error instanceof Response)return error;const message=error instanceof Error?error.message:'Unable to create channel';return Response.json({error:message},{status:message==='DUPLICATE_CHANNEL'?409:400})}}}}})
