import { z } from 'zod'

const publicConfig = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_ANON_KEY: z.string().min(1),
})

const required = z.object({
  SUPABASE_URL: z.url(), SUPABASE_ANON_KEY: z.string().min(1), SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  MUX_TOKEN_ID: z.string().min(1), MUX_TOKEN_SECRET: z.string().min(1), MUX_WEBHOOK_SECRET: z.string().min(1), APP_URL: z.url(),
  DIDIT_API_KEY: z.string().min(1), DIDIT_WEBHOOK_SECRET: z.string().min(1), DIDIT_WORKFLOW_ID: z.string().min(1),
  MUX_SIGNING_KEY_ID: z.string().min(1).optional(), MUX_SIGNING_PRIVATE_KEY: z.string().min(1).optional(),
})
export type PublicConfigEnv = z.infer<typeof publicConfig>
export type ServerEnv = z.infer<typeof required>
let publicConfigCached: PublicConfigEnv | undefined
let cached: ServerEnv | undefined

export function publicConfigEnv(source: NodeJS.ProcessEnv = process.env): PublicConfigEnv {
  if (source === process.env && publicConfigCached) return publicConfigCached
  const parsed = publicConfig.safeParse(source)
  if (!parsed.success) {
    throw new Error(`Invalid public configuration: ${parsed.error.issues.map(i => i.path.join('.')).join(', ')}`)
  }
  if (source === process.env) publicConfigCached = parsed.data
  return parsed.data
}

export function env(source: NodeJS.ProcessEnv = process.env): ServerEnv {
  if (source === process.env && cached) return cached
  const parsed = required.safeParse(source)
  if (!parsed.success) throw new Error(`Invalid server environment: ${parsed.error.issues.map(i => i.path.join('.')).join(', ')}`)
  if (source === process.env) cached = parsed.data
  return parsed.data
}
