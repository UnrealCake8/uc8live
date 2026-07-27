import { z } from 'zod'

const required = z.object({
  SUPABASE_URL: z.url(), SUPABASE_ANON_KEY: z.string().min(1), SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  MUX_TOKEN_ID: z.string().min(1), MUX_TOKEN_SECRET: z.string().min(1), MUX_WEBHOOK_SECRET: z.string().min(1), APP_URL: z.url(),
  MUX_SIGNING_KEY_ID: z.string().min(1).optional(), MUX_SIGNING_PRIVATE_KEY: z.string().min(1).optional(),
})
export type ServerEnv = z.infer<typeof required>
let cached: ServerEnv | undefined
export function env(source: NodeJS.ProcessEnv = process.env): ServerEnv {
  if (source === process.env && cached) return cached
  const parsed = required.safeParse(source)
  if (!parsed.success) throw new Error(`Invalid server environment: ${parsed.error.issues.map(i => i.path.join('.')).join(', ')}`)
  if (source === process.env) cached = parsed.data
  return parsed.data
}
