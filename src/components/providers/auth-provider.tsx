'use client'

import { AuthProvider as OidcAuthProvider, useAuth } from 'react-oidc-context'
import type { UserManagerSettings } from 'oidc-client-ts'
import { ReactNode, useEffect, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { setAccessToken } from '@/lib/auth/token-store'
import { getEnv } from '@/lib/env'

function useOidcConfig(): UserManagerSettings {
  return useMemo(() => {
    const authority = getEnv('OIDC_AUTHORIZATION_SERVER_URI')
    const clientId = getEnv('OIDC_CLIENT_ID')
    const redirectUri = getEnv('OIDC_REDIRECT_URI')
    const scope = getEnv('OIDC_SCOPE')

    return {
      authority,
      client_id: clientId,
      redirect_uri: redirectUri,
      scope,
      automaticSilentRenew: true,
      loadUserInfo: false,
    }
  }, [])
}

function AuthTokenSync() {
  const auth = useAuth()

  useEffect(() => {
    setAccessToken(auth.user?.access_token ?? null)
  }, [auth.user?.access_token])

  return null
}

function AuthGate() {
  const auth = useAuth()
  const pathname = usePathname()

  useEffect(() => {
    const publicPaths = ['/auth/callback']
    if (publicPaths.includes(pathname)) return
    if (auth.isLoading || auth.activeNavigator) return
    if (!auth.isAuthenticated && !auth.error) {
      auth.signinRedirect().catch(() => undefined)
    }
  }, [auth, pathname])

  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const oidcConfig = useOidcConfig()

  return (
    <OidcAuthProvider
      {...oidcConfig}
      onSigninCallback={() => {
        window.history.replaceState({}, document.title, window.location.pathname)
      }}
    >
      <AuthTokenSync />
      <AuthGate />
      {children}
    </OidcAuthProvider>
  )
}
