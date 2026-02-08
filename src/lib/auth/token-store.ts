import { getEnv } from '@/lib/env'

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

export function getAccessTokenFromStorage(): string | null {
  if (typeof window === 'undefined') return null

  const authority = getEnv('OIDC_AUTHORIZATION_SERVER_URI')
  const clientId = getEnv('OIDC_CLIENT_ID')
  const storageKey = `oidc.user:${authority}:${clientId}`
  const stored =
    window.sessionStorage.getItem(storageKey) ??
    window.localStorage.getItem(storageKey)

  if (!stored) return null

  try {
    const parsed = JSON.parse(stored) as { access_token?: string }
    return parsed?.access_token ?? null
  } catch {
    return null
  }
}
