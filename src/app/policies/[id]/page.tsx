'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import AppLayout from '@/components/app-layout'
import { Link } from '@/components/link'
import { PolicyEditor } from '@/components/policy-editor/policy-editor'
import {
  useGetPoliciesId,
  usePutPoliciesId,
  useDeletePoliciesId,
  useGetPoliciesIdAttachments,
  getGetPoliciesQueryKey,
  getGetPoliciesIdQueryKey,
} from '@/lib/api/generated/policy-resource/policy-resource'
import type { StatementDto, UpdatePolicyRequest, PolicyAttachmentResponse } from '@/lib/api/models'

type TabType = 'overview' | 'statements' | 'attachments' | 'settings'

function getPrincipalLink(urn: string): { href: string; label: string } | null {
  // Parse URN format: urn:revet:iam::user/{id} or urn:revet:iam::group/{id}
  const userMatch = urn.match(/^urn:revet:iam::user\/(.+)$/)
  if (userMatch) {
    return { href: `/users/${userMatch[1]}`, label: 'User' }
  }
  const groupMatch = urn.match(/^urn:revet:iam::group\/(.+)$/)
  if (groupMatch) {
    return { href: `/groups/${groupMatch[1]}`, label: 'Group' }
  }
  return null
}

export default function PolicyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const policyId = params.id as string

  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [version, setVersion] = useState('')
  const [statements, setStatements] = useState<StatementDto[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: policyData, isLoading, error: loadError } = useGetPoliciesId(policyId, {
    query: { enabled: !!policyId },
  })

  const { data: attachmentsData, isLoading: isLoadingAttachments } = useGetPoliciesIdAttachments(
    policyId,
    { query: { enabled: !!policyId } }
  )

  const updateMutation = usePutPoliciesId()
  const deleteMutation = useDeletePoliciesId()

  useEffect(() => {
    if (policyData) {
      setName(policyData.name)
      setDescription(policyData.description ?? '')
      setVersion(policyData.version)
      setStatements(policyData.statements ?? [])
    }
  }, [policyData])

  const attachments = useMemo(() => {
    if (!attachmentsData) return []
    if (Array.isArray(attachmentsData)) return attachmentsData
    if ('items' in attachmentsData) {
      return (attachmentsData as { items: PolicyAttachmentResponse[] }).items
    }
    if ('content' in attachmentsData) {
      return (attachmentsData as { content: PolicyAttachmentResponse[] }).content
    }
    return [attachmentsData]
  }, [attachmentsData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Policy name is required')
      return
    }

    if (statements.length === 0) {
      setError('At least one statement is required')
      return
    }

    for (let i = 0; i < statements.length; i++) {
      if (statements[i].actions.length === 0) {
        setError(`Statement ${i + 1} must have at least one action`)
        return
      }
      if (statements[i].resources.length === 0) {
        setError(`Statement ${i + 1} must have at least one resource`)
        return
      }
    }

    setIsSubmitting(true)

    try {
      const payload: UpdatePolicyRequest = {
        name: name.trim(),
        description: description.trim() || null,
        version: version.trim(),
        statements,
      }

      await updateMutation.mutateAsync({ id: policyId, data: payload })
      await queryClient.invalidateQueries({ queryKey: getGetPoliciesQueryKey() })
      await queryClient.invalidateQueries({ queryKey: getGetPoliciesIdQueryKey(policyId) })
    } catch (err) {
      console.error('Failed to update policy:', err)
      setError(err instanceof Error ? err.message : 'Failed to update policy')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteMutation.mutateAsync({ id: policyId })
      await queryClient.invalidateQueries({ queryKey: getGetPoliciesQueryKey() })
      router.push('/policies')
    } catch (err) {
      console.error('Failed to delete policy:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete policy')
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          Loading policy...
        </div>
      </AppLayout>
    )
  }

  if (loadError || !policyData) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 text-red-600 dark:text-red-400">
          Failed to load policy. Please try again.
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {policyData.name}
          </h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-400">
            {policyData.description || 'View and manage policy details.'}
          </p>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {(['overview', 'statements', 'attachments', 'settings'] as TabType[]).map((tab) => (
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
          {activeTab === 'overview' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                  Policy Details
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      disabled={isSubmitting}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={isSubmitting}
                      rows={2}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Version
                    </label>
                    <input
                      type="text"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      disabled={isSubmitting}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
                    />
                  </div>

                  {policyData.createdOn && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Created
                      </label>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(policyData.createdOn).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/policies')}
                  disabled={isSubmitting}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                >
                  Back to Policies
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

          {activeTab === 'statements' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                  Policy Statements
                </h2>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  Define the permissions for this policy by adding statements.
                </p>
                <PolicyEditor
                  statements={statements}
                  onChange={setStatements}
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/policies')}
                  disabled={isSubmitting}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                >
                  Back to Policies
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

          {activeTab === 'attachments' && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Attachments
              </h2>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Users and groups that have this policy attached.
              </p>
              {isLoadingAttachments ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading attachments...</p>
              ) : attachments.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This policy is not attached to any users or groups.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-white">
                          Type
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-white">
                          Principal URN
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-white">
                          Attached On
                        </th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-900 dark:text-white">
                          <span className="sr-only">View</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {attachments.map((attachment) => {
                        const principalLink = getPrincipalLink(attachment.principalUrn)
                        return (
                          <tr key={attachment.id ?? attachment.principalUrn}>
                            <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                              {principalLink?.label ?? 'Unknown'}
                            </td>
                            <td className="px-3 py-2 font-mono text-gray-700 dark:text-gray-300">
                              {attachment.principalUrn}
                            </td>
                            <td className="px-3 py-2 text-gray-500 dark:text-gray-400">
                              {attachment.attachedOn
                                ? new Date(attachment.attachedOn).toLocaleDateString()
                                : '-'}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {principalLink && (
                                <Link
                                  href={principalLink.href}
                                  className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                >
                                  View
                                </Link>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-900/10">
                <h2 className="text-lg font-semibold text-red-800 dark:text-red-400">
                  Danger Zone
                </h2>
                <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                  Deleting this policy will remove it from all users and groups. This action cannot be undone.
                </p>

                {error && activeTab === 'settings' && (
                  <div className="mt-4 rounded-md bg-red-100 p-3 dark:bg-red-900/30">
                    <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                  </div>
                )}

                {showDeleteConfirm ? (
                  <div className="mt-4 flex items-center gap-3">
                    <span className="text-sm text-red-700 dark:text-red-300">
                      Are you sure you want to delete this policy?
                    </span>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50"
                    >
                      {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="mt-4 inline-flex items-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50 dark:border-red-700 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    Delete Policy
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
