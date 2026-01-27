'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import AppLayout from '@/components/app-layout'
import { PolicyEditor } from '@/components/policy-editor/policy-editor'
import {
  usePostPolicies,
  getGetPoliciesQueryKey,
} from '@/lib/api/generated/policy-resource/policy-resource'
import type { StatementDto, CreatePolicyRequest } from '@/lib/api/models'

export default function NewPolicyPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [version, setVersion] = useState('1.0')
  const [statements, setStatements] = useState<StatementDto[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createMutation = usePostPolicies()

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
      const payload: CreatePolicyRequest = {
        name: name.trim(),
        description: description.trim() || null,
        version: version.trim(),
        statements,
      }

      await createMutation.mutateAsync({ data: payload })
      await queryClient.invalidateQueries({ queryKey: getGetPoliciesQueryKey() })
      router.push('/policies')
    } catch (err) {
      console.error('Failed to create policy:', err)
      setError(err instanceof Error ? err.message : 'Failed to create policy')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Create Policy
          </h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-400">
            Define a new access control policy with statements.
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
                  placeholder="e.g., ReadOnlyDocuments"
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
                  placeholder="Describe what this policy grants access to..."
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
                  placeholder="1.0"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
                />
              </div>
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

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/policies')}
              disabled={isSubmitting}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Policy'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  )
}
