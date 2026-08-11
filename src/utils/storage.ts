import type { LabelDimensions, LabelItem } from '../types'

const PASSWORD_KEY = 'labelpress_password_hash'
const DATA_KEY = 'labelpress_data'
const SESSION_KEY = 'labelpress_unlocked'

export interface SavedAppData {
  items: LabelItem[]
  nextSku: number
  size: LabelDimensions
}

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function hasPassword(): boolean {
  return Boolean(localStorage.getItem(PASSWORD_KEY))
}

export async function setPassword(password: string): Promise<void> {
  const hash = await hashPassword(password.trim())
  localStorage.setItem(PASSWORD_KEY, hash)
}

export async function verifyPassword(password: string): Promise<boolean> {
  const stored = localStorage.getItem(PASSWORD_KEY)
  if (!stored) return false
  const hash = await hashPassword(password.trim())
  return hash === stored
}

export function isUnlocked(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === '1'
}

export function unlockSession(): void {
  sessionStorage.setItem(SESSION_KEY, '1')
}

export function lockSession(): void {
  sessionStorage.removeItem(SESSION_KEY)
}

export function loadSavedData(): SavedAppData | null {
  try {
    const raw = localStorage.getItem(DATA_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SavedAppData
    if (!Array.isArray(parsed.items)) return null
    return parsed
  } catch {
    return null
  }
}

export function saveAppData(data: SavedAppData): void {
  localStorage.setItem(DATA_KEY, JSON.stringify(data))
}
