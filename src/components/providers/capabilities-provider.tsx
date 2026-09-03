'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useGetApiV1Capabilities } from '@/lib/api/generated/capability-resource/capability-resource'
import type { ResolvedCapabilityDto } from '@/lib/api/models'

interface CapabilitiesContextValue {
  capabilities: ResolvedCapabilityDto[]
  isLoading: boolean
  error: unknown
}

const CapabilitiesContext = createContext<CapabilitiesContextValue>({
  capabilities: [],
  isLoading: true,
  error: null,
})

export function useCapabilities() {
  return useContext(CapabilitiesContext)
}

export function useCapability(id: string) {
  const { capabilities, isLoading } = useCapabilities()
  if (isLoading) {
    return { available: false, granted: false, enabled: false }
  }
  const cap = capabilities.find((c) => c.id === id)
  if (!cap) {
    return { available: false, granted: false, enabled: false }
  }
  return { available: cap.available, granted: cap.granted, enabled: cap.enabled }
}

export function CapabilitiesProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, error } = useGetApiV1Capabilities()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-4 border-gray-300 border-t-indigo-600 dark:border-gray-600 dark:border-t-indigo-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  const value: CapabilitiesContextValue = {
    capabilities: data?.capabilities ?? [],
    isLoading: false,
    error: error ?? null,
  }

  return (
    <CapabilitiesContext.Provider value={value}>
      {children}
    </CapabilitiesContext.Provider>
  )
}
