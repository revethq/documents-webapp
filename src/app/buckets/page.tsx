'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/app-layout'
import PageHeader from '@/components/page-header'
import EmptyState from '@/components/empty-state'
import { CircleStackIcon } from '@heroicons/react/24/outline'
import { Link } from '@/components/link'
import { useGetApiV1Buckets } from '@/lib/api/generated/buckets/buckets'
import type { BucketDTO } from '@/lib/api/models'

const providerLabels: Record<string, string> = {
  S3: 'Amazon S3',
  GCS: 'Google Cloud Storage',
  AZURE_BLOB: 'Azure Blob Storage',
  MINIO: 'MinIO / S3-Compatible',
}

export default function BucketsPage() {
  const router = useRouter()
  const { data: bucketsResponse, isLoading } = useGetApiV1Buckets()

  const buckets = useMemo(() => {
    if (!bucketsResponse) return []
    if (Array.isArray(bucketsResponse)) return bucketsResponse
    if ('content' in bucketsResponse) return (bucketsResponse as { content: BucketDTO[] }).content
    return [bucketsResponse]
  }, [bucketsResponse])

  return (
    <AppLayout>
      <PageHeader
        title="Storage Buckets"
        description="Configure cloud storage buckets for document storage."
        actionLabel="Add Bucket"
        onAction={() => router.push('/buckets/new')}
      />

      {isLoading ? (
        <div className="mt-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent dark:border-indigo-400"></div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading storage buckets...</p>
        </div>
      ) : buckets.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={CircleStackIcon}
            title="No storage buckets"
            description="Configure a cloud storage bucket to enable document uploads and downloads."
            actionLabel="Add Bucket"
            onAction={() => router.push('/buckets/new')}
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
                      Provider
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      Bucket
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      Region
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
                  {buckets.map((bucket) => (
                    <tr key={bucket.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 sm:pl-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {bucket.name}
                        </div>
                        {bucket.endpoint && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {bucket.endpoint}
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {providerLabels[bucket.provider] || bucket.provider}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {bucket.bucketName}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {bucket.region || '—'}
                      </td>
                      <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                        <Link
                          href={`/buckets/${bucket.uuid}`}
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
