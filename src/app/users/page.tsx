'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/app-layout'
import PageHeader from '@/components/page-header'
import EmptyState from '@/components/empty-state'
import { Link } from '@/components/link'
import { UsersIcon } from '@heroicons/react/24/outline'
import { useGetApiV1Users } from '@/lib/api/generated/user-resource/user-resource'
import type { UserResponse } from '@/lib/api/models'
import RequireCapability from '@/components/require-capability'

export default function UsersPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const { data: usersResponse, isLoading, error } = useGetApiV1Users({ page: 0 })

  const users = useMemo(() => {
    if (!usersResponse) return []
    return usersResponse.content ?? []
  }, [usersResponse])

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return users
    return users.filter((user) => {
      const values = [user.email, user.username]
      return values.some((value) => value.toLowerCase().includes(query))
    })
  }, [users, searchQuery])

  return (
    <AppLayout>
      <RequireCapability id="documents:manage-users">
      <PageHeader
        title="Users"
        description="Manage user accounts, roles, and access."
        actionLabel="Add user"
        onAction={() => router.push('/users/new')}
      />

      <div className="mt-6">
        <input
          type="search"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="block w-full max-w-md rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {isLoading ? (
        <div className="mt-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent dark:border-indigo-400"></div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading users...</p>
        </div>
      ) : error ? (
        <div className="mt-8 rounded-md bg-red-50 p-4 dark:bg-red-900/10">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-400">Error loading users</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error instanceof Error ? error.message : 'An unknown error occurred'}</p>
              </div>
            </div>
          </div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={UsersIcon}
            title={searchQuery ? 'No matching users' : 'No users'}
            description={
              searchQuery
                ? 'Try adjusting your search to find the user you need.'
                : 'Invite your first user to get started.'
            }
            actionLabel="Add user"
            onAction={() => router.push('/users/new')}
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
                      Username
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="relative py-3.5 pl-3 pr-4 text-right text-sm font-semibold text-gray-900 dark:text-white sm:pr-0"
                    >
                      View
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-0">
                        {user.username}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </td>
                      <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                        <Link
                          href={`/users/${user.id}`}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          View
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
    </RequireCapability>
    </AppLayout>
  )
}
