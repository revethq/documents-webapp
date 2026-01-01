'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import AppLayout from "@/components/app-layout"
import { Button } from '@/components/button'
import { Input } from '@/components/input'
import { Select } from '@/components/select'
import { Field, Label, Description } from '@/components/fieldset'
import { Heading, Subheading } from '@/components/heading'
import { Text } from '@/components/text'
import { Badge } from '@/components/badge'
import { TagPicker } from '@/components/tag-picker'
import { ErrorBanner } from '@/components/error-banner'
import {
  CloudArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  BuildingOfficeIcon,
  FolderIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/solid'
import { useGetApiV1Organizations } from '@/lib/api/generated/organizations/organizations'
import { useGetApiV1Projects } from '@/lib/api/generated/projects/projects'
import { useGetApiV1Categories } from '@/lib/api/generated/categories/categories'
import { useGetApiV1Tags, usePostApiV1Tags } from '@/lib/api/generated/tags/tags'
import { usePostApiV1Documents, getGetApiV1DocumentsQueryKey } from '@/lib/api/generated/documents/documents'
import { usePostApiV1FilesInitiateUpload } from '@/lib/api/generated/files/files'
import { usePutApiV1DocumentVersionsUuidCompleteUpload } from '@/lib/api/generated/document-versions/document-versions'
import type { OrganizationDTO, ProjectDTO, CategoryDTO, TagDTO } from '@/lib/api/models'
import { getErrorMessage } from '@/lib/errors'

type Step = 'organization' | 'project' | 'details' | 'upload'

interface UploadState {
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error'
  progress: number
  fileName: string | null
  error: string | null
}

const STEPS: { id: Step; name: string; icon: typeof BuildingOfficeIcon }[] = [
  { id: 'organization', name: 'Organization', icon: BuildingOfficeIcon },
  { id: 'project', name: 'Project', icon: FolderIcon },
  { id: 'details', name: 'Details', icon: DocumentTextIcon },
  { id: 'upload', name: 'Upload', icon: CloudArrowUpIcon },
]

export default function NewDocumentPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [currentStep, setCurrentStep] = useState<Step>('organization')
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [documentName, setDocumentName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [actionError, setActionError] = useState<string | null>(null)

  // Upload state
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: 0,
    fileName: null,
    error: null,
  })

  // Drag state
  const [isDragging, setIsDragging] = useState(false)

  // API queries
  const { data: organizationsResponse, error: organizationsError } = useGetApiV1Organizations()
  const { data: projectsResponse, error: projectsError } = useGetApiV1Projects(
    selectedOrgId ? { organizationId: selectedOrgId } : undefined,
    { query: { enabled: selectedOrgId !== null } }
  )
  const { data: categoriesResponse, error: categoriesError } = useGetApiV1Categories(
    selectedProjectId ? { projectId: selectedProjectId } : undefined,
    { query: { enabled: selectedProjectId !== null } }
  )
  const { data: tagsResponse, refetch: refetchTags, error: tagsError } = useGetApiV1Tags()
  const createTag = usePostApiV1Tags()
  const createDocument = usePostApiV1Documents()
  const initiateUpload = usePostApiV1FilesInitiateUpload()
  const completeUpload = usePutApiV1DocumentVersionsUuidCompleteUpload()

  // Parse responses
  const organizations: OrganizationDTO[] = (() => {
    if (!organizationsResponse) return []
    if (Array.isArray(organizationsResponse)) return organizationsResponse
    if ('content' in organizationsResponse) return organizationsResponse.content as OrganizationDTO[]
    return [organizationsResponse]
  })()

  const projects: ProjectDTO[] = (() => {
    if (!projectsResponse) return []
    if (Array.isArray(projectsResponse)) return projectsResponse
    if ('content' in projectsResponse) return projectsResponse.content as ProjectDTO[]
    return [projectsResponse]
  })()

  const categories: CategoryDTO[] = (() => {
    if (!categoriesResponse) return []
    if (Array.isArray(categoriesResponse)) return categoriesResponse
    if ('content' in categoriesResponse) return categoriesResponse.content as CategoryDTO[]
    return [categoriesResponse]
  })()

  const allTags: TagDTO[] = (() => {
    if (!tagsResponse) return []
    if (Array.isArray(tagsResponse)) return tagsResponse
    if ('content' in tagsResponse) return (tagsResponse as { content: TagDTO[] }).content
    return [tagsResponse]
  })()



  // Get current step index
  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep)

  // Navigation helpers
  const canGoNext = () => {
    switch (currentStep) {
      case 'organization':
        return selectedOrgId !== null
      case 'project':
        return selectedProjectId !== null
      case 'details':
        return documentName.trim() !== ''
      case 'upload':
        return false
      default:
        return false
    }
  }

  const goNext = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id)
    }
  }

  const goBack = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id)
    }
  }

  // Create tag handler for TagPicker
  const handleCreateTag = async (name: string) => {
    try {
      const newTag = await createTag.mutateAsync({ data: { name } })
      await refetchTags()
      return newTag
    } catch (error) {
      setActionError(getErrorMessage(error, 'Unable to create tag.'))
      throw error
    }
  }

  // File handling
  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file)
    setUploadState(prev => ({ ...prev, fileName: file.name, status: 'idle', error: null }))
  }, [])

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
    if (!selectedFile || !selectedProjectId) return

    setUploadState({
      status: 'uploading',
      progress: 0,
      fileName: selectedFile.name,
      error: null,
    })

    try {
      // Step 1: Create the document
      const document = await createDocument.mutateAsync({
        data: {
          name: documentName || selectedFile.name,
          projectId: selectedProjectId,
          categoryId: selectedCategoryId,
          mime: selectedFile.type || 'application/octet-stream',
          tags: selectedTags,
        },
      })

      if (!document.uuid) {
        throw new Error('Failed to create document')
      }

      // Step 2: Initiate upload to get presigned URL
      const uploadInit = await initiateUpload.mutateAsync({
        data: {
          documentUuid: document.uuid,
          fileName: selectedFile.name,
          contentType: selectedFile.type || 'application/octet-stream',
        },
      })

      // Step 3: Upload file to S3 using XMLHttpRequest for progress tracking
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

      // Step 4: Complete the upload
      setUploadState(prev => ({ ...prev, status: 'processing' }))

      await completeUpload.mutateAsync({ uuid: uploadInit.documentVersionUuid })

      setUploadState(prev => ({ ...prev, status: 'complete', progress: 100 }))

      // Invalidate documents cache and redirect after a short delay
      await queryClient.invalidateQueries({ queryKey: getGetApiV1DocumentsQueryKey() })
      setTimeout(() => {
        router.push('/documents')
      }, 1500)

    } catch (error) {
      setActionError(getErrorMessage(error, 'Upload failed. Please try again.'))
      setUploadState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed',
      }))
    }
  }

  // Get selected names for display
  const selectedOrgName = organizations.find(o => o.id === selectedOrgId)?.name
  const selectedProjectName = projects.find(p => p.id === selectedProjectId)?.name
  const queryError = organizationsError || projectsError || categoriesError || tagsError
  const errorMessage = actionError
    ? actionError
    : queryError
      ? getErrorMessage(queryError, 'Failed to load form data. Please try again.')
      : null

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Heading>Upload Document</Heading>
          <Text className="mt-2">Add a new document to your project.</Text>
        </div>
        {errorMessage && (
          <ErrorBanner
            message={errorMessage}
            onDismiss={actionError ? () => setActionError(null) : undefined}
          />
        )}

        {/* Step indicator */}
        <nav aria-label="Progress" className="mb-8">
          <ol className="flex items-center">
            {STEPS.map((step, index) => {
              const isComplete = index < currentStepIndex
              const isCurrent = step.id === currentStep

              return (
                <li key={step.id} className={`relative ${index !== STEPS.length - 1 ? 'flex-1' : ''}`}>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => index < currentStepIndex && setCurrentStep(step.id)}
                      disabled={index > currentStepIndex}
                      className={`relative flex size-10 items-center justify-center rounded-full transition-colors ${
                        isComplete
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : isCurrent
                          ? 'border-2 border-blue-600 bg-white dark:bg-zinc-900'
                          : 'border-2 border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900'
                      }`}
                    >
                      {isComplete ? (
                        <CheckIcon className="size-5 text-white" />
                      ) : (
                        <step.icon className={`size-5 ${isCurrent ? 'text-blue-600' : 'text-zinc-400'}`} />
                      )}
                    </button>
                    {index !== STEPS.length - 1 && (
                      <div className={`ml-2 h-0.5 flex-1 ${isComplete ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-700'}`} />
                    )}
                  </div>
                  <span className={`absolute -bottom-6 left-0 w-max text-xs font-medium ${
                    isCurrent ? 'text-blue-600' : 'text-zinc-500 dark:text-zinc-400'
                  }`}>
                    {step.name}
                  </span>
                </li>
              )
            })}
          </ol>
        </nav>

        {/* Content area */}
        <div className="mt-12 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800/50">
          {/* Organization Step */}
          {currentStep === 'organization' && (
            <div>
              <Subheading>Select Organization</Subheading>
              <Text className="mt-1">Choose the organization for this document.</Text>

              <div className="mt-6 space-y-3">
                {organizations.map(org => (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => {
                      setSelectedOrgId(org.id ?? null)
                      setSelectedProjectId(null)
                      setSelectedCategoryId(null)
                    }}
                    className={`flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-colors ${
                      selectedOrgId === org.id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <BuildingOfficeIcon className={`size-8 ${selectedOrgId === org.id ? 'text-blue-600' : 'text-zinc-400'}`} />
                    <div className="flex-1">
                      <p className={`font-medium ${selectedOrgId === org.id ? 'text-blue-900 dark:text-blue-100' : 'text-zinc-900 dark:text-white'}`}>
                        {org.name}
                      </p>
                      {org.description && (
                        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{org.description}</p>
                      )}
                    </div>
                    {selectedOrgId === org.id && (
                      <CheckCircleIcon className="size-6 text-blue-600" />
                    )}
                  </button>
                ))}

                {organizations.length === 0 && (
                  <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-600">
                    <BuildingOfficeIcon className="mx-auto size-12 text-zinc-400" />
                    <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">No organizations available</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Project Step */}
          {currentStep === 'project' && (
            <div>
              <Subheading>Select Project</Subheading>
              <Text className="mt-1">
                Choose a project in <Badge color="blue">{selectedOrgName}</Badge>
              </Text>

              <div className="mt-6 space-y-3">
                {projects.map(project => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => {
                      setSelectedProjectId(project.id ?? null)
                      setSelectedCategoryId(null)
                    }}
                    className={`flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-colors ${
                      selectedProjectId === project.id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <FolderIcon className={`size-8 ${selectedProjectId === project.id ? 'text-blue-600' : 'text-zinc-400'}`} />
                    <div className="flex-1">
                      <p className={`font-medium ${selectedProjectId === project.id ? 'text-blue-900 dark:text-blue-100' : 'text-zinc-900 dark:text-white'}`}>
                        {project.name}
                      </p>
                      {project.description && (
                        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{project.description}</p>
                      )}
                    </div>
                    {selectedProjectId === project.id && (
                      <CheckCircleIcon className="size-6 text-blue-600" />
                    )}
                  </button>
                ))}

                {projects.length === 0 && (
                  <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-600">
                    <FolderIcon className="mx-auto size-12 text-zinc-400" />
                    <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">No projects in this organization</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Details Step */}
          {currentStep === 'details' && (
            <div>
              <Subheading>Document Details</Subheading>
              <Text className="mt-1">
                Adding to <Badge color="purple">{selectedProjectName}</Badge>
              </Text>

              <div className="mt-6 space-y-6">
                <Field>
                  <Label>Document Name</Label>
                  <Description>Enter a name for this document, or leave blank to use the file name.</Description>
                  <Input
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    placeholder="e.g., Q4 Financial Report"
                  />
                </Field>

                {categories.length > 0 && (
                  <Field>
                    <Label>Category (Optional)</Label>
                    <Description>Organize this document into a category.</Description>
                    <Select
                      value={selectedCategoryId?.toString() ?? ''}
                      onChange={(e) => setSelectedCategoryId(e.target.value ? parseInt(e.target.value) : null)}
                    >
                      <option value="">No category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id?.toString()}>
                          {category.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}

                {/* Tags Section */}
                <Field>
                  <Label>Tags (Optional)</Label>
                  <Description>Add tags to help organize and find this document.</Description>
                  <TagPicker
                    availableTags={allTags}
                    selectedSlugs={selectedTags}
                    onSelectionChange={setSelectedTags}
                    onCreateTag={handleCreateTag}
                    placeholder="Select or create tags..."
                    mode="popover"
                  />
                </Field>
              </div>
            </div>
          )}

          {/* Upload Step */}
          {currentStep === 'upload' && (
            <div>
              <Subheading>Upload File</Subheading>
              <Text className="mt-1">
                Drag and drop your file or click to browse.
              </Text>

              {/* Summary */}
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge color="blue">{selectedOrgName}</Badge>
                <Badge color="purple">{selectedProjectName}</Badge>
                {documentName && <Badge color="zinc">{documentName}</Badge>}
                {selectedTags.map(tagSlug => {
                  const tag = allTags.find(t => t.slug === tagSlug)
                  return (
                    <Badge key={tagSlug} color="sky">{tag?.name ?? tagSlug}</Badge>
                  )
                })}
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
                      Redirecting to documents...
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
                    Upload Document
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
          )}
        </div>

        {/* Navigation buttons */}
        <div className="mt-6 flex justify-between">
          <Button
            outline
            onClick={goBack}
            disabled={currentStepIndex === 0}
            className={currentStepIndex === 0 ? 'invisible' : ''}
          >
            <ArrowLeftIcon className="size-4" />
            Back
          </Button>

          {currentStep !== 'upload' && (
            <Button
              onClick={goNext}
              disabled={!canGoNext()}
            >
              Next
              <ArrowRightIcon className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
