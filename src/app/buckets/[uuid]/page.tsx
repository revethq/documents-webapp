'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import AppLayout from '@/components/app-layout'
import {
  useGetApiV1BucketsUuid,
  usePutApiV1BucketsUuid,
} from '@/lib/api/generated/buckets/buckets'
import type { BucketDTO, UpdateBucketRequest } from '@/lib/api/models'

const providerLabels: Record<string, string> = {
  S3: 'Amazon S3',
  GCS: 'Google Cloud Storage',
  AZURE_BLOB: 'Azure Blob Storage',
  MINIO: 'MinIO / S3-Compatible',
}

const providerDescriptions: Record<
  string,
  { accessKeyLabel: string; secretKeyLabel: string; endpointRequired: boolean }
> = {
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

export default function BucketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const bucketUuid = params.uuid as string

  const { data: bucketData, isLoading, error } = useGetApiV1BucketsUuid(bucketUuid, {
    query: { enabled: !!bucketUuid },
  })
  const updateMutation = usePutApiV1BucketsUuid()

  const [formData, setFormData] = useState<BucketFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!bucketData) return
    const bucket = bucketData as BucketDTO
    setFormData({
      name: bucket.name,
      provider: bucket.provider,
      bucketName: bucket.bucketName,
      accessKey: '',
      secretKey: '',
      endpoint: bucket.endpoint ?? '',
      region: bucket.region ?? '',
      presignedUrlDurationMinutes: bucket.presignedUrlDurationMinutes ?? 60,
    })
  }, [bucketData])

  const providerConfig = useMemo(() => {
    return providerDescriptions[formData.provider] || providerDescriptions.S3
  }, [formData.provider])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const payload: UpdateBucketRequest = {
        name: formData.name,
        bucketName: formData.bucketName,
        endpoint: formData.endpoint || null,
        region: formData.region || null,
        presignedUrlDurationMinutes: formData.presignedUrlDurationMinutes,
      }

      if (formData.accessKey) payload.accessKey = formData.accessKey
      if (formData.secretKey) payload.secretKey = formData.secretKey

      await updateMutation.mutateAsync({ uuid: bucketUuid, data: payload })
      await queryClient.invalidateQueries({
        predicate: (query) =>
          typeof query.queryKey[0] === 'string' && query.queryKey[0].includes('/api/v1/buckets'),
      })
    } catch (submitError) {
      console.error('Failed to update bucket:', submitError)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          Loading bucket...
        </div>
      </AppLayout>
    )
  }

  if (error || !bucketData) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 text-red-600 dark:text-red-400">
          Failed to load bucket. Please try again.
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{bucketData.name}</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-400">
            View and update bucket configuration.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Storage Provider
                </label>
                <input
                  type="text"
                  disabled
                  value={providerLabels[formData.provider] || formData.provider}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Bucket Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.bucketName}
                  onChange={(event) =>
                    setFormData({ ...formData, bucketName: event.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Region
                </label>
                <input
                  type="text"
                  value={formData.region}
                  onChange={(event) => setFormData({ ...formData, region: event.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="us-east-1"
                />
              </div>

              {(formData.provider === 'MINIO' || formData.endpoint) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Custom Endpoint {providerConfig.endpointRequired && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="url"
                    required={providerConfig.endpointRequired}
                    value={formData.endpoint}
                    onChange={(event) => setFormData({ ...formData, endpoint: event.target.value })}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="https://minio.example.com"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {providerConfig.accessKeyLabel}
                </label>
                <input
                  type="text"
                  value={formData.accessKey}
                  onChange={(event) => setFormData({ ...formData, accessKey: event.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Leave blank to keep current"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {providerConfig.secretKeyLabel}
                </label>
                <input
                  type="password"
                  value={formData.secretKey}
                  onChange={(event) => setFormData({ ...formData, secretKey: event.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Leave blank to keep current"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Presigned URL Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10080"
                  value={formData.presignedUrlDurationMinutes}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      presignedUrlDurationMinutes: parseInt(event.target.value, 10) || 60,
                    })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  How long download links remain valid (1 - 10080 minutes)
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/buckets')}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            >
              Back to Buckets
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
