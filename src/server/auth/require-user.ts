import { createClient } from '@supabase/supabase-js'
import { getRequestHeader } from '@tanstack/react-start/server'
import { env } from '../env'

export async function requireUser() {
  const token=getRequestHeader('authorization')?.replace(/^Bearer\s+/i,'')
  if(!token) throw Response.json({error:'Authentication required'},{status:401})
  const e=env(); const client=createClient(e.SUPABASE_URL,e.SUPABASE_ANON_KEY,{auth:{persistSession:false}})
  const {data,error}=await client.auth.getUser(token)
  if(error||!data.user) throw Response.json({error:'Authentication required'},{status:401})
  return data.user
}
