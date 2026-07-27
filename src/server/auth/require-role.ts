import { adminDb } from '../db/admin'
import type { Role } from '../db/types'
import { requireUser } from './require-user'
const levels:Record<Role,number>={viewer:0,creator:1,admin:2}
export async function requireRole(role:Role){const user=await requireUser();const {data}=await adminDb().from('profiles').select('role').eq('id',user.id).single();const actual=data?.role as Role|undefined;if(!actual||levels[actual]<levels[role])throw Response.json({error:'Forbidden'},{status:403});return {user,role:actual}}
