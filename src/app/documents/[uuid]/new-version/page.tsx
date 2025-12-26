'use client'

import { useState, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import AppLayout from "@/components/app-layout"
import PageHeader from "@/components/page-header"
import { Button } from '@/components/button'
import { Input } from '@/components/input'
import { Field, Label, Description } from '@/components/fieldset'
import { Text } from '@/components/text'
import { Badge } from '@/components/badge'
import {
  CloudArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'
import {
  useGetApiV1DocumentsUuidUuid,
  getGetApiV1DocumentsUuidUuidQueryKey,
} from '@/lib/api/generated/documents/documents'
import { postApiV1FilesInitiateUpload } from '@/lib/api/generated/files/files'
import {
  putApiV1DocumentVersionsUuidCompleteUpload,
  getGetApiV1DocumentVersionsQueryKey,
} from '@/lib/api/generated/document-versions/document-versions'

interface UploadState {
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error'
  progress: number
  fileName: string | null
  error: string | null
}

export default function NewVersionPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const documentUuid = params.uuid as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [versionName, setVersionName] = useState('')

  // Upload state
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    fileName: null,
    error: null,
  })

  // Drag state
  const [isDragging, setIsDragging] = useState(false)

  // Fetch document details
  const { data: document, isLoading } = useGetApiV1DocumentsUuidUuid(
    documentUuid,
    { query: { enabled: !!documentUuid } }
  )

  // File handling
  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file)
    if (!versionName) {
      setVersionName(file.name)
    }
    setUploadState(prev => ({ ...prev, fileName: file.name, status: 'idle', error: null }))
  }, [versionName])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }, [handleFileSelect])

  // Upload function
  const handleUpload = async () => {
    if (!selectedFile || !document?.uuid) return

    setUploadState({
      status: 'uploading',
      progress: 0,
      fileName: selectedFile.name,
      error: null,
    })

    try {
      // Step 1: Initiate upload to get presigned URL
      const uploadInit = await postApiV1FilesInitiateUpload({
        documentUuid: document.uuid,
        fileName: versionName || selectedFile.name,
        contentType: selectedFile.type || 'application/octet-stream',
      })

      // Step 2: Upload file to S3 using XMLHttpRequest for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100)
            setUploadState(prev => ({ ...prev, progress }))
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        }

        xhr.onerror = () => reject(new Error('Upload failed'))

        xhr.open('PUT', uploadInit.uploadUrl)
        xhr.setRequestHeader('Content-Type', selectedFile.type || 'application/octet-stream')
        xhr.send(selectedFile)
      })

      // Step 3: Complete the upload
      setUploadState(prev => ({ ...prev, status: 'processing' }))

      await putApiV1DocumentVersionsUuidCompleteUpload(uploadInit.documentVersionUuid)

      // Invalidate queries so document details page shows new version
      await queryClient.invalidateQueries({
        queryKey: getGetApiV1DocumentsUuidUuidQueryKey(documentUuid),
      })
      await queryClient.invalidateQueries({
        queryKey: getGetApiV1DocumentVersionsQueryKey(),
      })

      setUploadState(prev => ({ ...prev, status: 'complete', progress: 100 }))

      // Redirect to document detail page after a short delay
      setTimeout(() => {
        router.push(`/documents/${documentUuid}`)
      }, 1500)

    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed',
      }))
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-24">
          <div className="size-8 animate-spin rounded-full border-4 border-zinc-300 border-t-blue-600 dark:border-zinc-600 dark:border-t-blue-400" />
        </div>
      </AppLayout>
    )
  }

  if (!document) {
    return (
      <AppLayout>
        <div className="py-12 text-center">
          <DocumentIcon className="mx-auto size-12 text-zinc-400" />
          <h3 className="mt-2 text-sm font-semibold text-zinc-900 dark:text-white">Document not found</h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            The document you're looking for doesn't exist or you don't have access to it.
          </p>
          <div className="mt-6">
            <Button onClick={() => router.push('/documents')}>
              <ArrowLeftIcon className="size-4" />
              Back to Documents
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <PageHeader
        title="Upload New Version"
        description={`Adding a new version to "${document.name}"`}
      />

      <div className="mx-auto mt-8 max-w-2xl">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800/50">
          {/* Document info */}
          <div className="mb-6 flex items-center gap-3">
            <DocumentIcon className="size-8 text-zinc-400" />
            <div>
              <Text className="font-medium text-zinc-900 dark:text-white">{document.name}</Text>
              {document.mime && (
                <Badge color="zinc" className="mt-1">{document.mime}</Badge>
              )}
            </div>
          </div>

          {/* Version details */}
          <div className="space-y-4">
            <Field>
              <Label>Version Name</Label>
              <Description>Name for this version (defaults to file name)</Description>
              <Input
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                placeholder="e.g., v2.0 - Updated layout"
              />
            </Field>
          </div>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`mt-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : uploadState.status === 'complete'
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                : uploadState.status === 'error'
                ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                : 'border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-600 dark:hover:border-zinc-500 dark:hover:bg-zinc-800'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {uploadState.status === 'idle' && !selectedFile && (
              <>
                <CloudArrowUpIcon className={`size-16 ${isDragging ? 'text-blue-500' : 'text-zinc-400'}`} />
                <p className="mt-4 text-lg font-medium text-zinc-900 dark:text-white">
                  {isDragging ? 'Drop your file here' : 'Drag and drop your file here'}
                </p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  or click to browse
                </p>
              </>
            )}

            {uploadState.status === 'idle' && selectedFile && (
              <>
                <DocumentIcon className="size-16 text-blue-500" />
                <p className="mt-4 text-lg font-medium text-zinc-900 dark:text-white">
                  {selectedFile.name}
                </p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <p className="mt-2 text-xs text-zinc-400">Click to select a different file</p>
              </>
            )}

            {(uploadState.status === 'uploading' || uploadState.status === 'processing') && (
              <>
                <div className="relative size-16">
                  <svg className="size-16 -rotate-90" viewBox="0 0 64 64">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      className="text-zinc-200 dark:text-zinc-700"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeDasharray={175.93}
                      strokeDashoffset={175.93 * (1 - uploadState.progress / 100)}
                      className="text-blue-600 transition-all duration-300"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-zinc-900 dark:text-white">
                    {uploadState.progress}%
                  </span>
                </div>
                <p className="mt-4 text-lg font-medium text-zinc-900 dark:text-white">
                  {uploadState.status === 'processing' ? 'Processing...' : 'Uploading...'}
                </p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {uploadState.fileName}
                </p>
              </>
            )}

            {uploadState.status === 'complete' && (
              <>
                <CheckCircleIcon className="size-16 text-green-500" />
                <p className="mt-4 text-lg font-medium text-green-700 dark:text-green-400">
                  Upload Complete!
                </p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Redirecting to document...
                </p>
              </>
            )}

            {uploadState.status === 'error' && (
              <>
                <XCircleIcon className="size-16 text-red-500" />
                <p className="mt-4 text-lg font-medium text-red-700 dark:text-red-400">
                  Upload Failed
                </p>
                <p className="mt-1 text-sm text-red-500 dark:text-red-400">
                  {uploadState.error}
                </p>
                <p className="mt-2 text-xs text-zinc-400">Click to try again</p>
              </>
            )}
          </div>

          {/* Upload button */}
          {selectedFile && uploadState.status === 'idle' && (
            <div className="mt-6">
              <Button onClick={handleUpload} className="w-full">
                <CloudArrowUpIcon className="size-5" />
                Upload New Version
              </Button>
            </div>
          )}

          {uploadState.status === 'error' && (
            <div className="mt-6">
              <Button onClick={handleUpload} className="w-full">
                Try Again
              </Button>
            </div>
          )}
        </div>

        {/* Back button */}
        <div className="mt-6">
          <Button
            outline
            onClick={() => router.push(`/documents/${documentUuid}`)}
          >
            <ArrowLeftIcon className="size-4" />
            Back to Document
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}
