import { useEffect, useState } from 'react'
import { apiGet } from './api.js'
import IndusDesk from './IndusDesk.jsx'
import Login from './Login.jsx'
import { clearSession, loadSession } from './auth.js'

function App() {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const onAuth = () => setUser(null)
    window.addEventListener('indusdesk:auth', onAuth)
    return () => window.removeEventListener('indusdesk:auth', onAuth)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const s = loadSession()
      if (s?.token) {
        try {
          const me = await apiGet('/auth/me')
          if (!cancelled) setUser(me)
        } catch {
          clearSession()
          if (!cancelled) setUser(null)
        }
      } else {
        if (s?.user && !s?.token) clearSession()
        if (!cancelled) setUser(null)
      }
      if (!cancelled) setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (!ready) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center bg-[#0E141C] text-sm text-[#8197AC]">
        Carregando…
      </div>
    )
  }

  if (!user) {
    return <Login onLoggedIn={setUser} />
  }

  return (
    <IndusDesk
      user={user}
      onLogout={() => {
        clearSession()
        setUser(null)
      }}
    />
  )
}

export default App
