import { useState } from 'react'
import { apiPost } from './api.js'
import { DEFAULT_EMAIL, saveSession } from './auth.js'

export default function Login({ onLoggedIn }) {
  const [email, setEmail] = useState(DEFAULT_EMAIL)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const data = await apiPost('/auth/login', {
        email: email.trim(),
        password,
      })
      saveSession({ token: data.token, user: data.user })
      onLoggedIn(data.user)
    } catch (err) {
      setError(err.message || 'Não foi possível entrar.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-[#0E141C] px-4 py-10 font-sans">
      <div className="w-full max-w-md rounded-2xl border border-[#1E2D3E] bg-[#111923] p-8 shadow-[0_24px_64px_rgba(0,0,0,0.45)]">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            IndusDesk
          </h1>
          <p className="mt-1 text-sm text-[#8197AC]">
            Helpdesk industrial — entre com sua conta
          </p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#BDB3A3]"
            >
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[#1E2D3E] bg-[#0E141C] px-3 py-2.5 text-sm text-white outline-none ring-[#607EA2] placeholder:text-[#607EA2]/50 focus:border-[#607EA2] focus:ring-2"
              placeholder={DEFAULT_EMAIL}
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#BDB3A3]"
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[#1E2D3E] bg-[#0E141C] px-3 py-2.5 text-sm text-white outline-none ring-[#607EA2] placeholder:text-[#607EA2]/50 focus:border-[#607EA2] focus:ring-2"
              placeholder="••••••••"
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-[#D95B5B]/40 bg-[#D95B5B]/15 px-3 py-2 text-sm text-[#E8A8A8]">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-lg bg-[#314B6E] py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
          >
            {submitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs leading-relaxed text-[#607EA2]/90">
          A API deve estar rodando (
          <code className="rounded bg-[#0E141C] px-1 py-0.5 font-mono text-[10px]">
            npm run dev
          </code>{' '}
          sobe Vite + servidor). Usuário padrão no servidor:{' '}
          <span className="font-mono text-[#BDB3A3]">{DEFAULT_EMAIL}</span> — senha em{' '}
          <code className="rounded bg-[#0E141C] px-1 py-0.5 font-mono text-[10px]">
            ADMIN_PASSWORD
          </code>{' '}
          ou <span className="text-[#BDB3A3]">indus2024</span> por padrão.
        </p>
      </div>
    </div>
  )
}
