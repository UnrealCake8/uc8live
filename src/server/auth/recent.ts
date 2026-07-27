import type { User } from '@supabase/supabase-js'
export function hasRecentAuthentication(user:User,maxAgeSeconds=600){const authenticatedAt=user.last_sign_in_at?Date.parse(user.last_sign_in_at)/1000:0;return Date.now()/1000-authenticatedAt<maxAgeSeconds}
