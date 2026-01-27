'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import AppLayout from '@/components/app-layout'
import { PolicyEditor } from '@/components/policy-editor/policy-editor'
import {
  useGetPoliciesId,
  usePutPoliciesId,
  useGetPoliciesIdAttachments,
  getGetPoliciesQueryKey,
  getGetPoliciesIdQueryKey,
} from '@/lib/api/generated/policy-resource/policy-resource'
import type { StatementDto, UpdatePolicyRequest, PolicyAttachmentResponse } from '@/lib/api/models'

export default function PolicyDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const policyId = params.id as string

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [version, setVersion] = useState('')
  const [statements, setStatements] = useState<StatementDto[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: policyData, isLoading, error: loadError } = useGetPoliciesId(policyId, {
    query: { enabled: !!policyId },
  })

  const { data: attachmentsData, isLoading: isLoadingAttachments } = useGetPoliciesIdAttachments(
    policyId,
    { query: { enabled: !!policyId } }
  )

  const updateMutation = usePutPoliciesId()

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
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Edit Policy
          </h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-400">
            Update the policy settings and statements.
          </p>
        </div>

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

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Statements
            </h2>
            <PolicyEditor
              statements={statements}
              onChange={setStatements}
              disabled={isSubmitting}
            />
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Attachments
            </h2>
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
                        Principal URN
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-white">
                        Attached On
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {attachments.map((attachment) => (
                      <tr key={attachment.id ?? attachment.principalUrn}>
                        <td className="px-3 py-2 font-mono text-gray-700 dark:text-gray-300">
                          {attachment.principalUrn}
                        </td>
                        <td className="px-3 py-2 text-gray-500 dark:text-gray-400">
                          {attachment.attachedOn
                            ? new Date(attachment.attachedOn).toLocaleDateString()
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
      </div>
    </AppLayout>
  )
}
