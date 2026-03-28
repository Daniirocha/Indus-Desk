import { clearSession, loadSession } from './auth.js'

export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`
  const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
  const full = `/api${p}`
  return base ? `${base}${full}` : full
}

export async function apiFetch(path, options = {}) {
  const session = loadSession()
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (session?.token) headers.Authorization = `Bearer ${session.token}`
  const res = await fetch(apiUrl(path), { ...options, headers })
  if (res.status === 401 && session?.token) {
    clearSession()
    window.dispatchEvent(new Event('indusdesk:auth'))
  }
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { error: text }
  }
  if (!res.ok) throw new Error(data?.error || `Erro ${res.status}`)
  return data
}

export function apiGet(path) {
  return apiFetch(path, { method: 'GET' })
}

export function apiPost(path, body) {
  return apiFetch(path, { method: 'POST', body: JSON.stringify(body) })
}

export function apiPatch(path, body) {
  return apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) })
}
