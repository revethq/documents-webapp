'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import AppLayout from '@/components/app-layout'
import { Select } from '@/components/select'
import {
  useGetGroupsId,
  usePutGroupsId,
  useGetGroupsIdMembers,
  usePostGroupsIdMembers,
  useDeleteGroupsIdMembersMemberId,
  getGetGroupsIdMembersQueryKey,
  useGetGroups,
} from '@/lib/api/generated/group-resource/group-resource'
import {
  useGetGroupsIdPolicies,
  getGetGroupsIdPoliciesQueryKey,
} from '@/lib/api/generated/group-policy-resource/group-policy-resource'
import {
  useGetPolicies,
  usePostPoliciesIdAttachments,
  useDeletePoliciesIdAttachmentsAttachmentId,
} from '@/lib/api/generated/policy-resource/policy-resource'
import { useGetUsers } from '@/lib/api/generated/user-resource/user-resource'
import type {
  GroupResponse,
  GroupMemberResponse,
  UpdateGroupRequest,
  UserResponse,
  PolicyResponse,
  AttachedPolicyResponse,
} from '@/lib/api/models'
import { MemberType } from '@/lib/api/models'

interface GroupFormData {
  displayName: string
}

const initialFormData: GroupFormData = {
  displayName: '',
}

type TabType = 'profile' | 'members' | 'policies'

export default function GroupDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const groupId = params.id as string

  const [activeTab, setActiveTab] = useState<TabType>('profile')
  const [formData, setFormData] = useState<GroupFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [selectedMemberType, setSelectedMemberType] = useState<MemberType>(MemberType.USER)
  const [selectedPolicyId, setSelectedPolicyId] = useState('')

  const { data: groupData, isLoading, error } = useGetGroupsId(groupId, {
    query: { enabled: !!groupId },
  })
  const updateMutation = usePutGroupsId()

  const isMembersTab = activeTab === 'members'
  const isPoliciesTab = activeTab === 'policies'

  const { data: membersData, isLoading: isLoadingMembers } = useGetGroupsIdMembers(groupId, {
    query: { enabled: isMembersTab && !!groupId },
  })

  const { data: usersResponse, isLoading: isLoadingUsers } = useGetUsers(undefined, {
    query: { enabled: isMembersTab },
  })

  const { data: groupsResponse, isLoading: isLoadingGroups } = useGetGroups(undefined, {
    query: { enabled: isMembersTab },
  })

  const { data: groupPoliciesData, isLoading: isLoadingGroupPolicies } = useGetGroupsIdPolicies(
    groupId,
    undefined,
    { query: { enabled: isPoliciesTab && !!groupId } }
  )

  const { data: allPoliciesData, isLoading: isLoadingAllPolicies } = useGetPolicies(undefined, {
    query: { enabled: isPoliciesTab },
  })

  const addMemberMutation = usePostGroupsIdMembers()
  const removeMemberMutation = useDeleteGroupsIdMembersMemberId()
  const attachPolicyMutation = usePostPoliciesIdAttachments()
  const detachPolicyMutation = useDeletePoliciesIdAttachmentsAttachmentId()

  useEffect(() => {
    if (!groupData) return
    const group = groupData as GroupResponse
    setFormData({
      displayName: group.displayName,
    })
  }, [groupData])

  const members = useMemo(() => {
    if (!membersData) return []
    if (Array.isArray(membersData)) return membersData
    return [membersData]
  }, [membersData])

  const users = useMemo(() => {
    if (!usersResponse) return []
    if (Array.isArray(usersResponse)) return usersResponse
    if ('content' in usersResponse) return (usersResponse as { content: UserResponse[] }).content
    return [usersResponse]
  }, [usersResponse])

  const groups = useMemo(() => {
    if (!groupsResponse) return []
    if (Array.isArray(groupsResponse)) return groupsResponse
    if ('content' in groupsResponse) return (groupsResponse as { content: GroupResponse[] }).content
    return [groupsResponse]
  }, [groupsResponse])

  const groupPolicies = useMemo(() => {
    if (!groupPoliciesData) return []
    if (Array.isArray(groupPoliciesData)) return groupPoliciesData
    if ('items' in groupPoliciesData) {
      return (groupPoliciesData as { items: AttachedPolicyResponse[] }).items
    }
    if ('content' in groupPoliciesData) {
      return (groupPoliciesData as { content: AttachedPolicyResponse[] }).content
    }
    return [groupPoliciesData] as AttachedPolicyResponse[]
  }, [groupPoliciesData])

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
    return new Set(groupPolicies.map((p) => p.policy.id))
  }, [groupPolicies])

  const availablePolicies = useMemo(() => {
    return allPolicies.filter((policy) => !attachedPolicyIds.has(policy.id))
  }, [allPolicies, attachedPolicyIds])

  const memberIds = useMemo(() => {
    return new Set(members.map((m) => m.memberId))
  }, [members])

  const availableUsers = useMemo(() => {
    return users.filter((user) => !memberIds.has(user.id))
  }, [users, memberIds])

  const availableGroups = useMemo(() => {
    return groups.filter((group) => group.id !== groupId && !memberIds.has(group.id))
  }, [groups, groupId, memberIds])

  const userById = useMemo(() => {
    const map = new Map<string, UserResponse>()
    users.forEach((user) => {
      if (user.id) {
        map.set(user.id, user)
      }
    })
    return map
  }, [users])

  const groupById = useMemo(() => {
    const map = new Map<string, GroupResponse>()
    groups.forEach((group) => {
      if (group.id) {
        map.set(group.id, group)
      }
    })
    return map
  }, [groups])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const payload: UpdateGroupRequest = {
        displayName: formData.displayName.trim(),
      }

      await updateMutation.mutateAsync({ id: groupId, data: payload })
      await queryClient.invalidateQueries({
        predicate: (query) =>
          typeof query.queryKey[0] === 'string' && query.queryKey[0].includes('/groups'),
      })
    } catch (submitError) {
      console.error('Failed to update group:', submitError)
    } finally {
      setIsSubmitting(false)
    }
  }

  const refreshMembers = async () => {
    await queryClient.invalidateQueries({ queryKey: getGetGroupsIdMembersQueryKey(groupId) })
  }

  const refreshPolicies = async () => {
    // Invalidate both the group policies and all policies queries
    await queryClient.invalidateQueries({
      predicate: (query) =>
        typeof query.queryKey[0] === 'string' &&
        (query.queryKey[0] === `/groups/${groupId}/policies` ||
          query.queryKey[0] === '/policies'),
    })
  }

  const handleAddMember = async () => {
    if (!selectedMemberId) return
    try {
      await addMemberMutation.mutateAsync({
        id: groupId,
        data: { memberId: selectedMemberId, memberType: selectedMemberType },
      })
      await refreshMembers()
      setSelectedMemberId('')
    } catch (addError) {
      console.error('Failed to add member:', addError)
    }
  }

  const handleRemoveMember = async (member: GroupMemberResponse) => {
    try {
      await removeMemberMutation.mutateAsync({
        id: groupId,
        memberId: member.memberId,
      })
      await refreshMembers()
    } catch (removeError) {
      console.error('Failed to remove member:', removeError)
    }
  }

  const handleAttachPolicy = async () => {
    if (!selectedPolicyId) return
    try {
      await attachPolicyMutation.mutateAsync({
        id: selectedPolicyId,
        data: { principalUrn: `urn:revet:iam::group/${groupId}` },
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

  const getMemberDisplayName = (member: GroupMemberResponse) => {
    if (member.memberType === MemberType.USER) {
      const user = userById.get(member.memberId)
      if (user) {
        return user.username || user.email || member.memberId
      }
    } else if (member.memberType === MemberType.GROUP) {
      const group = groupById.get(member.memberId)
      if (group) {
        return group.displayName
      }
    }
    return member.memberId
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          Loading group...
        </div>
      </AppLayout>
    )
  }

  if (error || !groupData) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 text-red-600 dark:text-red-400">
          Failed to load group. Please try again.
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {groupData.displayName}
          </h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-400">
            View and update group details.
          </p>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {(['profile', 'members', 'policies'] as TabType[]).map((tab) => (
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
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Display Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.displayName}
                      onChange={(event) => setFormData({ ...formData, displayName: event.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  {groupData.createdOn && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Created
                      </label>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(groupData.createdOn).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {groupData.updatedOn && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Last Updated
                      </label>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(groupData.updatedOn).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/groups')}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                >
                  Back to Groups
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

          {activeTab === 'members' && (
            <div className="space-y-8">
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Group Members
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Manage users and groups that belong to this group.
                    </p>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                    <Select
                      value={selectedMemberType}
                      onChange={(event) => {
                        setSelectedMemberType(event.target.value as MemberType)
                        setSelectedMemberId('')
                      }}
                      className="w-full sm:w-32"
                    >
                      <option value={MemberType.USER}>User</option>
                      <option value={MemberType.GROUP}>Group</option>
                    </Select>
                    <Select
                      value={selectedMemberId}
                      onChange={(event) => setSelectedMemberId(event.target.value)}
                      className="w-full sm:w-56"
                    >
                      <option value="">
                        {selectedMemberType === MemberType.USER ? 'Select user' : 'Select group'}
                      </option>
                      {selectedMemberType === MemberType.USER
                        ? availableUsers.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.username || user.email}
                            </option>
                          ))
                        : availableGroups.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.displayName}
                            </option>
                          ))}
                    </Select>
                    <button
                      type="button"
                      onClick={handleAddMember}
                      disabled={!selectedMemberId}
                      className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="mt-6">
                  {isLoadingMembers || isLoadingUsers || isLoadingGroups ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Loading members...
                    </div>
                  ) : members.length === 0 ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      No members in this group.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
                        <thead>
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-white">
                              Member
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-white">
                              Type
                            </th>
                            <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-white">
                              Added
                            </th>
                            <th className="px-3 py-2 text-right font-semibold text-gray-900 dark:text-white">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                          {members.map((member) => (
                            <tr key={member.id ?? member.memberId}>
                              <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                                {getMemberDisplayName(member)}
                              </td>
                              <td className="px-3 py-2">
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                    member.memberType === MemberType.USER
                                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                      : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                  }`}
                                >
                                  {member.memberType}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-gray-500 dark:text-gray-400">
                                {member.createdOn
                                  ? new Date(member.createdOn).toLocaleDateString()
                                  : '-'}
                              </td>
                              <td className="px-3 py-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMember(member)}
                                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                >
                                  Remove
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

          {activeTab === 'policies' && (
            <div className="space-y-8">
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Attached Policies
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Manage policies attached to this group.
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
                  {isLoadingGroupPolicies || isLoadingAllPolicies ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Loading policies...
                    </div>
                  ) : groupPolicies.length === 0 ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      No policies attached to this group.
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
                          {groupPolicies.map((attachedPolicy) => (
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
