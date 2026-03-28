export const SESSION_KEY = 'indusdesk_session'

/** E-mail sugerido no formulário (deve existir no servidor). */
export const DEFAULT_EMAIL =
  import.meta.env.VITE_DEFAULT_EMAIL ?? 'ti@industria.com.br'

/**
 * Sessão após login na API: { token, user: { name, email } }
 */
export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return null
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}
