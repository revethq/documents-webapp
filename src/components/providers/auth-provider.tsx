'use client'

import { AuthProvider as OidcAuthProvider, useAuth } from 'react-oidc-context'
import type { UserManagerSettings } from 'oidc-client-ts'
import { ReactNode, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { setAccessToken } from '@/lib/auth/token-store'

const authority = process.env.NEXT_PUBLIC_OIDC_AUTHORITY ?? ''
const clientId = process.env.NEXT_PUBLIC_OIDC_CLIENT_ID ?? ''
const redirectUri = process.env.NEXT_PUBLIC_OIDC_REDIRECT_URI ?? ''
const scope = process.env.NEXT_PUBLIC_OIDC_SCOPE ?? ''
const authorizationServerUri =
  process.env.NEXT_PUBLIC_OIDC_AUTHORIZATION_SERVER_URI ?? ''

const metadataUrl = authorizationServerUri
  ? `${authorizationServerUri.replace(/\/$/, '')}/.well-known/openid-configuration`
  : undefined

const oidcConfig: UserManagerSettings = {
  authority,
  client_id: clientId,
  redirect_uri: redirectUri,
  scope,
  automaticSilentRenew: true,
  loadUserInfo: false,
  metadataUrl,
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
