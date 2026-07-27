import { createClient } from '@supabase/supabase-js'
let client:ReturnType<typeof createClient>|undefined
export async function supabaseBrowser(){if(client)return client;const response=await fetch('/api/config');if(!response.ok)throw new Error('Authentication is not configured');const config=await response.json();client=createClient(config.url,config.anonKey);return client}
export async function authHeaders():Promise<Record<string,string>>{const supabase=await supabaseBrowser();const {data}=await supabase.auth.getSession();return data.session?{authorization:`Bearer ${data.session.access_token}`}:{}}
export async function authenticatedFetch(input:RequestInfo|URL,init:RequestInit={}){
  const request=async()=>fetch(input,{...init,headers:{...Object.fromEntries(new Headers(init.headers)),...await authHeaders()}})
  let response=await request()
  if(response.status===401){
    const supabase=await supabaseBrowser()
    const {data}=await supabase.auth.refreshSession()
    if(data.session)response=await request()
  }
  return response
}
