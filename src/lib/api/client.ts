import { getAccessToken, getAccessTokenFromStorage, setAccessToken } from '@/lib/auth/token-store'
import { getEnv } from '@/lib/env'

function buildUrl(input: string): string {
  const apiBaseUrl = getEnv('API_URL')
  if (!apiBaseUrl) {
    return input
  }

  if (input.startsWith('http://') || input.startsWith('https://')) {
    return input
  }

  const normalizedBase = apiBaseUrl.replace(/\/$/, '')
  const normalizedInput = input.startsWith('/') ? input : `/${input}`
  return `${normalizedBase}${normalizedInput}`
}

export async function apiFetch<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const token = getAccessToken() ?? getAccessTokenFromStorage()
  const headers = new Headers(init?.headers)
  const hasBody = init?.body != null
  const isFormData =
    typeof FormData !== 'undefined' && init?.body instanceof FormData

  if (token) {
    setAccessToken(token)
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (hasBody && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const requestUrl = typeof input === 'string' ? buildUrl(input) : input
  const response = await fetch(requestUrl, {
    ...init,
    headers,
  })

  if (!response.ok) {
    let message = ''
    try {
      const text = await response.text()
      if (text) {
        try {
          const parsed = JSON.parse(text)
          message = parsed?.detail || parsed?.message || text
        } catch {
          message = text
        }
      }
    } catch {
      message = ''
    }

    throw new Error(message || `Request failed with status ${response.status}`)
  }

  if ([204, 205, 304].includes(response.status)) {
    return {} as T
  }

  const text = await response.text()
  if (!text) {
    return {} as T
  }

  return JSON.parse(text) as T
}
