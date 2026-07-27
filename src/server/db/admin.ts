import { createClient } from '@supabase/supabase-js'
import { env } from '../env'
import type { Database } from './types'
export function adminDb() { const e=env(); return createClient<Database>(e.SUPABASE_URL,e.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}}) as any }
