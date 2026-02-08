'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/app-layout'
import PageHeader from '@/components/page-header'
import EmptyState from '@/components/empty-state'
import { Link } from '@/components/link'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'
import { useGetPolicies } from '@/lib/api/generated/policy-resource/policy-resource'
import type { PolicyResponse } from '@/lib/api/models'

export default function PoliciesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const { data: policiesResponse, isLoading, error } = useGetPolicies()

  const policies = useMemo(() => {
    if (!policiesResponse) return []
    if (Array.isArray(policiesResponse)) return policiesResponse
    if ('items' in policiesResponse) return (policiesResponse as { items: PolicyResponse[] }).items
    if ('content' in policiesResponse) return (policiesResponse as { content: PolicyResponse[] }).content
    if ('policies' in policiesResponse) return (policiesResponse as { policies: PolicyResponse[] }).policies
    return [policiesResponse]
  }, [policiesResponse])

  const filteredPolicies = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return policies
    return policies.filter((policy) => {
      return (
        policy.name.toLowerCase().includes(query) ||
        (policy.description?.toLowerCase().includes(query) ?? false)
      )
    })
  }, [policies, searchQuery])

  return (
    <AppLayout>
      <PageHeader
        title="Policies"
        description="Manage access control policies for users and groups."
        actionLabel="Create policy"
        onAction={() => router.push('/policies/new')}
      />

      <div className="mt-6">
        <input
          type="search"
          placeholder="Search policies..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="block w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {isLoading ? (
        <div className="mt-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent dark:border-indigo-400"></div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading policies...</p>
        </div>
      ) : error ? (
        <div className="mt-8 rounded-md bg-red-50 p-4 dark:bg-red-900/10">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-400">Error loading policies</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error instanceof Error ? error.message : 'An unknown error occurred'}</p>
              </div>
            </div>
          </div>
        </div>
      ) : filteredPolicies.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={ShieldCheckIcon}
            title={searchQuery ? 'No matching policies' : 'No policies'}
            description={
              searchQuery
                ? 'Try adjusting your search to find the policy you need.'
                : 'Create your first policy to define access permissions.'
            }
            actionLabel="Create policy"
            onAction={() => router.push('/policies/new')}
          />
        </div>
      ) : (
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-0"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      Description
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      Version
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      Statements
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      Created
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                      <span className="sr-only">View</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredPolicies.map((policy) => (
                    <tr key={policy.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-0">
                        {policy.name}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                        {policy.description ?? '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {policy.version}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {policy.statements?.length ?? 0}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {policy.createdOn ? new Date(policy.createdOn).toLocaleDateString() : '-'}
                      </td>
                      <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                        <Link
                          href={`/policies/${policy.id}`}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          View<span className="sr-only">, {policy.name}</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
