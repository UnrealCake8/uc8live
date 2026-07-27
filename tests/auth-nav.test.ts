import { describe, expect, it } from 'vitest'
import fs from 'node:fs'

describe('authentication navigation', () => {
  const source = fs.readFileSync('src/components/AuthNav.tsx', 'utf8')

  it('restores the persisted Supabase session before presenting auth actions', () => {
    expect(source).toContain('supabase.auth.getSession()')
    expect(source).toContain("'Checking…'")
  })

  it('stays synchronized when Supabase refreshes or clears a session', () => {
    expect(source).toContain('supabase.auth.onAuthStateChange')
    expect(source).toContain('listener.data.subscription.unsubscribe()')
  })

  it('only signs a user out after an explicit action', () => {
    expect(source).toContain('onClick={signOut}')
    expect(source).toContain('supabase.auth.signOut()')
  })
})
