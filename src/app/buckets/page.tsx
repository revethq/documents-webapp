'use client'

import { useState, useMemo } from 'react'
import AppLayout from '@/components/app-layout'
import PageHeader from '@/components/page-header'
import EmptyState from '@/components/empty-state'
import { CircleStackIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useGetApiV1Buckets, usePostApiV1Buckets, usePutApiV1BucketsId, useDeleteApiV1BucketsId } from '@/lib/api/generated/buckets/buckets'
import { useQueryClient } from '@tanstack/react-query'
import type { BucketDTO, CreateBucketRequest, UpdateBucketRequest } from '@/lib/api/models'
import { StorageProvider } from '@/lib/api/models'

const providerLabels: Record<string, string> = {
  S3: 'Amazon S3',
  GCS: 'Google Cloud Storage',
  AZURE_BLOB: 'Azure Blob Storage',
  MINIO: 'MinIO / S3-Compatible',
}

const providerDescriptions: Record<string, { accessKeyLabel: string; secretKeyLabel: string; endpointRequired: boolean }> = {
  S3: {
    accessKeyLabel: 'Access Key ID',
    secretKeyLabel: 'Secret Access Key',
    endpointRequired: false,
  },
  GCS: {
    accessKeyLabel: 'Access Key (HMAC)',
    secretKeyLabel: 'Secret Key (HMAC)',
    endpointRequired: false,
  },
  AZURE_BLOB: {
    accessKeyLabel: 'Storage Account Name',
    secretKeyLabel: 'Storage Account Key',
    endpointRequired: false,
  },
  MINIO: {
    accessKeyLabel: 'Access Key',
    secretKeyLabel: 'Secret Key',
    endpointRequired: true,
  },
}

interface BucketFormData {
  name: string
  provider: string
  bucketName: string
  accessKey: string
  secretKey: string
  endpoint: string
  region: string
  presignedUrlDurationMinutes: number
}

const initialFormData: BucketFormData = {
  name: '',
  provider: 'S3',
  bucketName: '',
  accessKey: '',
  secretKey: '',
  endpoint: '',
  region: '',
  presignedUrlDurationMinutes: 60,
}

export default function BucketsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBucket, setEditingBucket] = useState<BucketDTO | null>(null)
  const [formData, setFormData] = useState<BucketFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  const queryClient = useQueryClient()
  const { data: bucketsResponse, isLoading } = useGetApiV1Buckets()
  const createMutation = usePostApiV1Buckets()
  const updateMutation = usePutApiV1BucketsId()
  const deleteMutation = useDeleteApiV1BucketsId()

  const buckets = useMemo(() => {
    if (!bucketsResponse) return []
    if (Array.isArray(bucketsResponse)) return bucketsResponse
    if ('content' in bucketsResponse) return (bucketsResponse as { content: BucketDTO[] }).content
    return [bucketsResponse]
  }, [bucketsResponse])

  const openCreateModal = () => {
    setEditingBucket(null)
    setFormData(initialFormData)
    setIsModalOpen(true)
  }

  const openEditModal = (bucket: BucketDTO) => {
    setEditingBucket(bucket)
    setFormData({
      name: bucket.name,
      provider: bucket.provider,
      bucketName: bucket.bucketName,
      accessKey: '', // Don't prefill credentials
      secretKey: '',
      endpoint: bucket.endpoint ?? '',
      region: bucket.region ?? '',
      presignedUrlDurationMinutes: bucket.presignedUrlDurationMinutes ?? 60,
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingBucket(null)
    setFormData(initialFormData)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (editingBucket) {
        const updateData: UpdateBucketRequest = {
          name: formData.name,
          bucketName: formData.bucketName,
          endpoint: formData.endpoint || null,
          region: formData.region || null,
          presignedUrlDurationMinutes: formData.presignedUrlDurationMinutes,
        }
        // Only include credentials if provided
        if (formData.accessKey) updateData.accessKey = formData.accessKey
        if (formData.secretKey) updateData.secretKey = formData.secretKey

        await updateMutation.mutateAsync({ id: editingBucket.id!, data: updateData })
      } else {
        const createData: CreateBucketRequest = {
          name: formData.name,
          provider: formData.provider as StorageProvider,
          bucketName: formData.bucketName,
          accessKey: formData.accessKey,
          secretKey: formData.secretKey,
          endpoint: formData.endpoint || null,
          region: formData.region || null,
          presignedUrlDurationMinutes: formData.presignedUrlDurationMinutes,
        }
        await createMutation.mutateAsync({ data: createData })
      }

      queryClient.invalidateQueries({ queryKey: ['http://localhost:5051/api/v1/buckets'] })
      closeModal()
    } catch (error) {
      console.error('Failed to save bucket:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync({ id })
      queryClient.invalidateQueries({ queryKey: ['http://localhost:5051/api/v1/buckets'] })
      setDeleteConfirmId(null)
    } catch (error) {
      console.error('Failed to delete bucket:', error)
    }
  }

  const providerConfig = providerDescriptions[formData.provider] || providerDescriptions.S3

  return (
    <AppLayout>
      <PageHeader
        title="Storage Buckets"
        description="Configure cloud storage buckets for document storage."
        actionLabel="Add Bucket"
        onAction={openCreateModal}
      />

      {isLoading ? (
        <div className="mt-8 flex items-center justify-center py-12">
          <div className="size-8 animate-spin rounded-full border-4 border-zinc-300 border-t-blue-600 dark:border-zinc-600 dark:border-t-blue-400" />
        </div>
      ) : buckets.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={CircleStackIcon}
            title="No storage buckets"
            description="Configure a cloud storage bucket to enable document uploads and downloads."
            actionLabel="Add Bucket"
            onAction={openCreateModal}
          />
        </div>
      ) : (
        <div className="mt-8">
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Bucket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Region
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                {buckets.map((bucket) => (
                  <tr key={bucket.id}>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{bucket.name}</div>
                      {bucket.endpoint && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">{bucket.endpoint}</div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {providerLabels[bucket.provider] || bucket.provider}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {bucket.bucketName}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {bucket.region || '-'}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          bucket.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {bucket.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(bucket)}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                          title="Edit"
                        >
                          <PencilIcon className="size-5" />
                        </button>
                        {deleteConfirmId === bucket.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(bucket.id!)}
                              className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(bucket.id!)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-800 dark:hover:text-red-400"
                            title="Delete"
                          >
                            <TrashIcon className="size-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500/75 transition-opacity dark:bg-gray-900/75" onClick={closeModal} />

            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg dark:bg-gray-800">
              <form onSubmit={handleSubmit}>
                <div className="px-4 pb-4 pt-5 sm:p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {editingBucket ? 'Edit Bucket' : 'Add Storage Bucket'}
                  </h3>

                  <div className="space-y-4">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Display Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="My S3 Bucket"
                      />
                    </div>

                    {/* Provider */}
                    {!editingBucket && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Storage Provider
                        </label>
                        <select
                          value={formData.provider}
                          onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                          {Object.entries(StorageProvider).map(([key, value]) => (
                            <option key={key} value={value}>
                              {providerLabels[value] || value}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Bucket Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Bucket Name
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.bucketName}
                        onChange={(e) => setFormData({ ...formData, bucketName: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="my-bucket-name"
                      />
                    </div>

                    {/* Region */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Region
                      </label>
                      <input
                        type="text"
                        value={formData.region}
                        onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="us-east-1"
                      />
                    </div>

                    {/* Endpoint (for MinIO/custom) */}
                    {(formData.provider === 'MINIO' || formData.endpoint) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Custom Endpoint {providerConfig.endpointRequired && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="url"
                          required={providerConfig.endpointRequired}
                          value={formData.endpoint}
                          onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          placeholder="https://minio.example.com"
                        />
                      </div>
                    )}

                    {/* Access Key */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {providerConfig.accessKeyLabel}
                        {!editingBucket && <span className="text-red-500"> *</span>}
                      </label>
                      <input
                        type="text"
                        required={!editingBucket}
                        value={formData.accessKey}
                        onChange={(e) => setFormData({ ...formData, accessKey: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder={editingBucket ? '(leave blank to keep current)' : ''}
                      />
                    </div>

                    {/* Secret Key */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {providerConfig.secretKeyLabel}
                        {!editingBucket && <span className="text-red-500"> *</span>}
                      </label>
                      <input
                        type="password"
                        required={!editingBucket}
                        value={formData.secretKey}
                        onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder={editingBucket ? '(leave blank to keep current)' : ''}
                      />
                    </div>

                    {/* Presigned URL Duration */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Presigned URL Duration (minutes)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10080"
                        value={formData.presignedUrlDurationMinutes}
                        onChange={(e) => setFormData({ ...formData, presignedUrlDurationMinutes: parseInt(e.target.value) || 60 })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        How long download links remain valid (1 - 10080 minutes)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 dark:bg-gray-700/50">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 sm:ml-3 sm:w-auto"
                  >
                    {isSubmitting ? 'Saving...' : editingBucket ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto dark:bg-gray-600 dark:text-white dark:ring-gray-500 dark:hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
