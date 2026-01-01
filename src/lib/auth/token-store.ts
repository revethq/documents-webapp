let accessToken: string | null = null
const authority = process.env.NEXT_PUBLIC_OIDC_AUTHORITY ?? ''
const clientId = process.env.NEXT_PUBLIC_OIDC_CLIENT_ID ?? ''

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

export function getAccessTokenFromStorage(): string | null {
  if (typeof window === 'undefined') return null

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
