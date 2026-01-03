'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/app-layout'
import PageHeader from '@/components/page-header'
import EmptyState from '@/components/empty-state'
import { Link } from '@/components/link'
import { UsersIcon } from '@heroicons/react/24/outline'
import { useGetApiV1Users } from '@/lib/api/generated/users/users'
import type { UserDTO } from '@/lib/api/models'

export default function UsersPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [includeInactive, setIncludeInactive] = useState(false)

  const { data: usersResponse, isLoading, error } = useGetApiV1Users(
    includeInactive ? { includeInactive } : undefined
  )

  const users = useMemo(() => {
    if (!usersResponse) return []
    if (Array.isArray(usersResponse)) return usersResponse
    if ('content' in usersResponse) return (usersResponse as { content: UserDTO[] }).content
    return [usersResponse]
  }, [usersResponse])

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return users
    return users.filter((user) => {
      const values = [
        user.fullName,
        user.email,
        user.username,
        user.firstName ?? '',
        user.lastName ?? '',
      ]
      return values.some((value) => value.toLowerCase().includes(query))
    })
  }, [users, searchQuery])

  return (
    <AppLayout>
      <PageHeader
        title="Users"
        description="Manage user accounts, roles, and access."
        actionLabel="Add user"
        onAction={() => router.push('/users/new')}
      />

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <input
            type="search"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(event) => setIncludeInactive(event.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
          />
          Include inactive users
        </label>
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
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      Email
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      Role
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      Status
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
                    <tr key={user.uuid}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-0">
                        <div>{user.fullName || user.username}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{user.username}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {user.isSuperuser ? 'Superuser' : user.isStaff ? 'Staff' : 'User'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {user.isActive ? 'Active' : 'Inactive'}
                      </td>
                      <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                        <Link
                          href={`/users/${user.uuid}`}
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
    </AppLayout>
  )
}
