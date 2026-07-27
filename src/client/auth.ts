import { createClient } from '@supabase/supabase-js'
let client:ReturnType<typeof createClient>|undefined
export async function supabaseBrowser(){if(client)return client;const response=await fetch('/api/config');if(!response.ok)throw new Error('Authentication is not configured');const config=await response.json();client=createClient(config.url,config.anonKey);return client}
export async function authHeaders():Promise<Record<string,string>>{const supabase=await supabaseBrowser();const {data}=await supabase.auth.getSession();return data.session?{authorization:`Bearer ${data.session.access_token}`}:{}}
