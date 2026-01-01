'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from 'react-oidc-context'
import AppLayout from '@/components/app-layout'
import { Button } from '@/components/button'
import { getErrorMessage } from '@/lib/errors'

export default function AuthCallbackPage() {
  const auth = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated) {
      router.replace('/documents')
    }
  }, [auth.isLoading, auth.isAuthenticated, router])

  if (auth.error) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-lg py-16 text-center">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Sign-in failed
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {getErrorMessage(auth.error, 'Unable to complete authentication.')}
          </p>
          <div className="mt-6 flex justify-center">
            <Button onClick={() => auth.signinRedirect()}>
              Try again
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!auth.isLoading && !auth.isAuthenticated) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-lg py-16 text-center">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Finishing sign-in
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            We could not complete authentication. Please try again.
          </p>
          <div className="mt-6 flex justify-center">
            <Button onClick={() => auth.signinRedirect()}>
              Try again
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-center py-24 text-sm text-zinc-500 dark:text-zinc-400">
        Completing sign-in...
      </div>
    </AppLayout>
  )
}
