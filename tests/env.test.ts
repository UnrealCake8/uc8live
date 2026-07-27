import { describe, expect, it } from 'vitest'
import { env, publicConfigEnv } from '../src/server/env'

describe('environment configuration', () => {
  const publicVariables = {
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_ANON_KEY: 'browser-safe-key',
  }

  it('loads browser configuration without requiring unrelated server secrets', () => {
    expect(publicConfigEnv(publicVariables)).toEqual(publicVariables)
  })

  it('does not include server-only values in browser configuration', () => {
    expect(publicConfigEnv({
      ...publicVariables,
      SUPABASE_SERVICE_ROLE_KEY: 'secret',
      MUX_TOKEN_SECRET: 'secret',
    })).toEqual(publicVariables)
  })

  it('continues to require all server configuration for privileged operations', () => {
    expect(() => env(publicVariables)).toThrow('Invalid server environment')
  })
})
