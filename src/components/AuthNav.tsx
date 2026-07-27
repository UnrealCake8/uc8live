import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { LogOut, UserRound } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { supabaseBrowser } from '@/client/auth'

export function AuthNav() {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    let unsubscribe: (() => void) | undefined

    void supabaseBrowser().then(async (supabase) => {
      const { data } = await supabase.auth.getSession()
      if (!active) return

      setUser(data.session?.user ?? null)
      setReady(true)
      const listener = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)
      })
      unsubscribe = () => listener.data.subscription.unsubscribe()
    }).catch(() => {
      if (active) setReady(true)
    })

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [])

  async function signOut() {
    setSigningOut(true)
    const supabase = await supabaseBrowser()
    await supabase.auth.signOut()
    setSigningOut(false)
    await navigate({ to: '/' })
  }

  return <nav>
    <Link to="/live">Explore live</Link>
    <Link to="/creator">Creator Hub</Link>
    {ready && user
      ? <button type="button" className="navButton" onClick={signOut} disabled={signingOut} title={user.email ?? 'Signed in'}>
          <LogOut size={16}/> {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
      : <Link to="/login" className="navButton" aria-disabled={!ready}>
          <UserRound size={16}/> {ready ? 'Sign in' : 'Checking…'}
        </Link>}
  </nav>
}
