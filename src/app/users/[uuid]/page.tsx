'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import AppLayout from '@/components/app-layout'
import { Select } from '@/components/select'
import {
  useGetUsersId,
  usePutUsersId,
} from '@/lib/api/generated/user-resource/user-resource'
import {
  useGetUsersIdPolicies,
  getGetUsersIdPoliciesQueryKey,
} from '@/lib/api/generated/user-policy-resource/user-policy-resource'
import {
  useGetPolicies,
  usePostPoliciesIdAttachments,
  useDeletePoliciesIdAttachmentsAttachmentId,
} from '@/lib/api/generated/policy-resource/policy-resource'
import type {
  UpdateUserRequest,
  UserResponse,
  PolicyResponse,
  AttachedPolicyResponse,
} from '@/lib/api/models'

interface UserFormData {
  username: string
  email: string
}

const initialFormData: UserFormData = {
  username: '',
  email: '',
}

type TabType = 'profile' | 'policies'

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const userId = params.uuid as string

  const [activeTab, setActiveTab] = useState<TabType>('profile')
  const [formData, setFormData] = useState<UserFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedPolicyId, setSelectedPolicyId] = useState('')

  const { data: userData, isLoading, error } = useGetUsersId(userId, {
    query: { enabled: !!userId },
  })
  const updateMutation = usePutUsersId()

  const isPoliciesTab = activeTab === 'policies'

  const { data: userPoliciesData, isLoading: isLoadingUserPolicies } = useGetUsersIdPolicies(
    userId,
    undefined,
    { query: { enabled: isPoliciesTab && !!userId } }
  )

  const { data: allPoliciesData, isLoading: isLoadingAllPolicies } = useGetPolicies(undefined, {
    query: { enabled: isPoliciesTab },
  })

  const attachPolicyMutation = usePostPoliciesIdAttachments()
  const detachPolicyMutation = useDeletePoliciesIdAttachmentsAttachmentId()

  useEffect(() => {
    if (!userData) return
    const user = userData as UserResponse
    setFormData({
      username: user.username ?? '',
      email: user.email ?? '',
    })
  }, [userData])

  const userPolicies = useMemo(() => {
    if (!userPoliciesData) return []
    if (Array.isArray(userPoliciesData)) return userPoliciesData
    if ('items' in userPoliciesData) {
      return (userPoliciesData as { items: AttachedPolicyResponse[] }).items
    }
    if ('content' in userPoliciesData) {
      return (userPoliciesData as { content: AttachedPolicyResponse[] }).content
    }
    return [userPoliciesData] as AttachedPolicyResponse[]
  }, [userPoliciesData])

  const allPolicies = useMemo(() => {
    if (!allPoliciesData) return []
    if (Array.isArray(allPoliciesData)) return allPoliciesData
    if ('items' in allPoliciesData) {
      return (allPoliciesData as { items: PolicyResponse[] }).items
    }
    if ('content' in allPoliciesData) {
      return (allPoliciesData as { content: PolicyResponse[] }).content
    }
    return [allPoliciesData]
  }, [allPoliciesData])

  const attachedPolicyIds = useMemo(() => {
    return new Set(userPolicies.map((p) => p.policy.id))
  }, [userPolicies])

  const availablePolicies = useMemo(() => {
    return allPolicies.filter((policy) => !attachedPolicyIds.has(policy.id))
  }, [allPolicies, attachedPolicyIds])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const payload: UpdateUserRequest = {
        username: formData.username,
        email: formData.email,
      }

      await updateMutation.mutateAsync({ id: userId, data: payload })
      await queryClient.invalidateQueries({
        predicate: (query) =>
          typeof query.queryKey[0] === 'string' && query.queryKey[0].includes('/users'),
      })
    } catch (submitError) {
      console.error('Failed to update user:', submitError)
    } finally {
      setIsSubmitting(false)
    }
  }

  const refreshPolicies = async () => {
    // Invalidate both the user policies and all policies queries
    await queryClient.invalidateQueries({
      predicate: (query) =>
        typeof query.queryKey[0] === 'string' &&
        (query.queryKey[0] === `/users/${userId}/policies` ||
          query.queryKey[0] === '/policies'),
    })
  }

  const handleAttachPolicy = async () => {
    if (!selectedPolicyId) return
    try {
      await attachPolicyMutation.mutateAsync({
        id: selectedPolicyId,
        data: { principalUrn: `urn:revet:iam::user/${userId}` },
      })
      await refreshPolicies()
      setSelectedPolicyId('')
    } catch (attachError) {
      console.error('Failed to attach policy:', attachError)
    }
  }

  const handleDetachPolicy = async (attachedPolicy: AttachedPolicyResponse) => {
    try {
      await detachPolicyMutation.mutateAsync({
        id: attachedPolicy.policy.id,
        attachmentId: attachedPolicy.attachmentId,
      })
      await refreshPolicies()
    } catch (detachError) {
      console.error('Failed to detach policy:', detachError)
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          Loading user...
        </div>
      </AppLayout>
    )
  }

  if (error || !userData) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 text-red-600 dark:text-red-400">
          Failed to load user. Please try again.
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {userData.username}
          </h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-400">
            View and update user details.
          </p>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {(['profile', 'policies'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${
                  tab === activeTab
                    ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
                } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium capitalize`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6">
          {activeTab === 'profile' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Username
                    </label>
                    <input
                      type="text"
                      disabled
                      value={formData.username}
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/users')}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                >
                  Back to Users
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'policies' && (
            <div className="space-y-8">
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Attached Policies
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Manage policies attached to this user.
                    </p>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                    <Select
                      value={selectedPolicyId}
                      onChange={(event) => setSelectedPolicyId(event.target.value)}
                      className="w-full sm:w-56"
                    >
                      <option value="">Select policy</option>
                      {availablePolicies.map((policy) => (
                        <option key={policy.id} value={policy.id}>
                          {policy.name}
                        </option>
                      ))}
                    </Select>
                    <button
                      type="button"
                      onClick={handleAttachPolicy}
                      disabled={!selectedPolicyId}
                      className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                    >
                      Attach
                    </button>
                  </div>
                </div>

                <div className="mt-6">
                  {isLoadingUserPolicies || isLoadingAllPolicies ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Loading policies...
                    </div>
                  ) : userPolicies.length === 0 ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      No policies attached to this user.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
                        <thead>
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-white">
                              Policy
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-white">
                              Description
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-white">
                              Version
                            </th>
                            <th className="px-3 py-2 text-right font-semibold text-gray-900 dark:text-white">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                          {userPolicies.map((attachedPolicy) => (
                            <tr key={attachedPolicy.attachmentId}>
                              <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                                {attachedPolicy.policy.name}
                              </td>
                              <td className="px-3 py-2 text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                {attachedPolicy.policy.description ?? '-'}
                              </td>
                              <td className="px-3 py-2 text-gray-500 dark:text-gray-400">
                                {attachedPolicy.policy.version}
                              </td>
                              <td className="px-3 py-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDetachPolicy(attachedPolicy)}
                                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  Detach
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
