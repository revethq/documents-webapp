'use client'

import type { ReactNode } from 'react'
import { ShieldExclamationIcon } from '@heroicons/react/24/outline'
import { useCapability } from '@/components/providers/capabilities-provider'

export default function RequireCapability({
  id,
  children,
}: {
  id: string
  children: ReactNode
}) {
  const { available } = useCapability(id)

  if (!available) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShieldExclamationIcon className="size-12 text-gray-400 dark:text-gray-500" />
        <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
          Access restricted
        </h2>
        <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
          You don&apos;t have permission to access this feature. Contact your administrator if you
          believe this is an error.
        </p>
      </div>
    )
  }

  return <>{children}</>
}
