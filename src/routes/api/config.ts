import { createFileRoute } from '@tanstack/react-router'
import { publicConfigEnv } from '@/server/env'

export const Route = createFileRoute('/api/config')({
  server: {
    handlers: {
      GET: () => {
        const config = publicConfigEnv()
        return Response.json({ url: config.SUPABASE_URL, anonKey: config.SUPABASE_ANON_KEY })
      },
    },
  },
})
