import { useState, type FormEvent } from 'react'
import {
  hasPassword,
  setPassword,
  unlockSession,
  verifyPassword,
} from '../utils/storage'

interface AuthGateProps {
  onUnlocked: () => void
}

export function AuthGate({ onUnlocked }: AuthGateProps) {
  const needsSetup = !hasPassword()
  const [password, setPasswordInput] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const value = password.trim()
    if (value.length < 4) {
      setError('Password must be at least 4 characters.')
      return
    }

    setBusy(true)
    try {
      if (needsSetup) {
        if (value !== confirm.trim()) {
          setError('Passwords do not match.')
          return
        }
        await setPassword(value)
        unlockSession()
        onUnlocked()
        return
      }

      const ok = await verifyPassword(value)
      if (!ok) {
        setError('Incorrect password.')
        return
      }
      unlockSession()
      onUnlocked()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-stone-900">
      <div className="w-full max-w-sm rounded-xl border border-stone-200 bg-white/90 p-6 shadow-sm backdrop-blur">
        <p className="font-display text-2xl font-bold tracking-tight">LabelPress</p>
        <p className="mt-1 text-sm text-stone-600">
          {needsSetup
            ? 'Create a password to protect your saved labels.'
            : 'Enter your password to continue.'}
        </p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-stone-700">
              {needsSetup ? 'New password' : 'Password'}
            </label>
            <input
              id="password"
              type="password"
              autoFocus
              autoComplete={needsSetup ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
            />
          </div>

          {needsSetup && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirm" className="text-sm font-medium text-stone-700">
                Confirm password
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-50"
          >
            {busy ? 'Please wait…' : needsSetup ? 'Save password & continue' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  )
}
