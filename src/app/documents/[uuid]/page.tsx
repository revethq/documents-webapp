'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import AppLayout from "@/components/app-layout"
import PageHeader from "@/components/page-header"
import { Badge } from '@/components/badge'
import { Button } from '@/components/button'
import { Select } from '@/components/select'
import { Subheading } from '@/components/heading'
import { Text } from '@/components/text'
import { DescriptionList, DescriptionTerm, DescriptionDetails } from '@/components/description-list'
import { Dialog, DialogTitle, DialogDescription, DialogBody, DialogActions } from '@/components/dialog'
import { TagPicker } from '@/components/tag-picker'
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  DocumentIcon,
  ClockIcon,
  CloudArrowUpIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'
import {
  useGetApiV1DocumentsUuidUuid,
  usePutApiV1DocumentsId,
  useDeleteApiV1DocumentsId,
  getGetApiV1DocumentsUuidUuidQueryKey,
} from '@/lib/api/generated/documents/documents'
import {
  useGetApiV1DocumentVersions,
  getApiV1DocumentVersionsUuid,
} from '@/lib/api/generated/document-versions/document-versions'
import { useGetApiV1Projects } from '@/lib/api/generated/projects/projects'
import { useGetApiV1Organizations } from '@/lib/api/generated/organizations/organizations'
import { useGetApiV1Tags, postApiV1Tags } from '@/lib/api/generated/tags/tags'
import { useGetApiV1Categories } from '@/lib/api/generated/categories/categories'
import type { DocumentVersionDTO, ProjectDTO, OrganizationDTO, TagDTO, CategoryDTO } from '@/lib/api/models'

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Unknown size'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export default function DocumentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const documentUuid = params.uuid as string

  // Edit state
  const [isEditing, setIsEditing] = useState(false)
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null)
  const [editTags, setEditTags] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Delete state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch document details
  const { data: document, isLoading: isLoadingDocument } = useGetApiV1DocumentsUuidUuid(
    documentUuid,
    { query: { enabled: !!documentUuid } }
  )

  // Fetch document versions
  const { data: versionsResponse, isLoading: isLoadingVersions } = useGetApiV1DocumentVersions(
    document?.id ? { documentId: document.id } : undefined,
    { query: { enabled: !!document?.id } }
  )

  // Fetch projects to get organization info
  const { data: projectsResponse } = useGetApiV1Projects()

  // Fetch organizations to check bucket configuration
  const { data: organizationsResponse } = useGetApiV1Organizations()

  // Fetch tags
  const { data: tagsResponse, refetch: refetchTags } = useGetApiV1Tags()

  // Fetch categories for the document's project
  const { data: categoriesResponse } = useGetApiV1Categories(
    document?.projectId ? { projectId: document.projectId } : undefined,
    { query: { enabled: !!document?.projectId } }
  )

  // Mutations
  const updateDocument = usePutApiV1DocumentsId()
  const deleteDocument = useDeleteApiV1DocumentsId()

  // Parse projects
  const projects: ProjectDTO[] = useMemo(() => {
    if (!projectsResponse) return []
    if (Array.isArray(projectsResponse)) return projectsResponse
    if ('content' in projectsResponse) return (projectsResponse as { content: ProjectDTO[] }).content
    return [projectsResponse]
  }, [projectsResponse])

  // Parse organizations
  const organizations: OrganizationDTO[] = useMemo(() => {
    if (!organizationsResponse) return []
    if (Array.isArray(organizationsResponse)) return organizationsResponse
    if ('content' in organizationsResponse) return (organizationsResponse as { content: OrganizationDTO[] }).content
    return [organizationsResponse]
  }, [organizationsResponse])

  // Parse tags
  const allTags: TagDTO[] = useMemo(() => {
    if (!tagsResponse) return []
    if (Array.isArray(tagsResponse)) return tagsResponse
    if ('content' in tagsResponse) return (tagsResponse as { content: TagDTO[] }).content
    return [tagsResponse]
  }, [tagsResponse])

  // Parse categories
  const categories: CategoryDTO[] = useMemo(() => {
    if (!categoriesResponse) return []
    if (Array.isArray(categoriesResponse)) return categoriesResponse
    if ('content' in categoriesResponse) return (categoriesResponse as { content: CategoryDTO[] }).content
    return [categoriesResponse]
  }, [categoriesResponse])

  // Parse versions - handle both array and single object responses
  const versions: DocumentVersionDTO[] = useMemo(() => {
    if (!versionsResponse) return []
    if (Array.isArray(versionsResponse)) return versionsResponse
    // If it's a single version object, wrap it in an array
    if ('uuid' in versionsResponse) return [versionsResponse]
    if ('content' in versionsResponse) return (versionsResponse as { content: DocumentVersionDTO[] }).content
    return []
  }, [versionsResponse])

  // Sort versions by created date (newest first)
  const sortedVersions = useMemo(() => {
    return [...versions].sort((a, b) =>
      new Date(b.created).getTime() - new Date(a.created).getTime()
    )
  }, [versions])

  // Get project and organization info
  const project = useMemo(() => {
    return projects.find(p => p.id === document?.projectId)
  }, [projects, document?.projectId])

  const organization = useMemo(() => {
    if (!project?.organizationId) return null
    return organizations.find(o => o.id === project.organizationId)
  }, [organizations, project?.organizationId])

  // Check if organization has a bucket configured
  const hasBucket = organization?.bucketId != null

  // Get tag name by slug
  const getTagName = (slug: string) => {
    const tag = allTags.find(t => t.slug === slug)
    return tag?.name ?? slug
  }

  // Handle download - fetch version by UUID to get presigned URL
  const handleDownload = async (versionUuid: string, fileName: string) => {
    try {
      // Fetch the version to get a fresh presigned download URL
      const version = await getApiV1DocumentVersionsUuid(versionUuid)

      if (!version.downloadUrl) {
        return
      }

      const fileResponse = await fetch(version.downloadUrl)
      const blob = await fileResponse.blob()

      const url = window.URL.createObjectURL(blob)
      const a = window.document.createElement('a')
      a.href = url
      a.download = fileName
      window.document.body.appendChild(a)
      a.click()

      window.URL.revokeObjectURL(url)
      window.document.body.removeChild(a)
    } catch {
      // Download failed silently
    }
  }

  // Start editing
  const handleStartEdit = () => {
    setEditCategoryId(document?.categoryId ?? null)
    setEditTags(document?.tags ?? [])
    setIsEditing(true)
  }

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditCategoryId(document?.categoryId ?? null)
    setEditTags(document?.tags ?? [])
  }

  // Save changes
  const handleSave = async () => {
    if (!document?.id) return

    setIsSaving(true)
    try {
      await updateDocument.mutateAsync({
        id: document.id,
        data: {
          name: document.name,
          categoryId: editCategoryId,
          tags: editTags,
        },
      })
      // Invalidate the document query to refetch
      queryClient.invalidateQueries({ queryKey: getGetApiV1DocumentsUuidUuidQueryKey(documentUuid) })
      setIsEditing(false)
    } catch {
      // Update failed silently
    } finally {
      setIsSaving(false)
    }
  }

  // Handle create tag
  const handleCreateTag = async (name: string) => {
    const newTag = await postApiV1Tags({ name })
    await refetchTags()
    return newTag
  }

  // Handle delete
  const handleDelete = async () => {
    if (!document?.id) return

    setIsDeleting(true)
    try {
      await deleteDocument.mutateAsync({ id: document.id })
      router.push('/documents')
    } catch {
      setIsDeleting(false)
    }
  }

  // Get category name by ID
  const getCategoryName = (categoryId?: number | null) => {
    if (!categoryId) return null
    const category = categories.find(c => c.id === categoryId)
    return category?.name ?? null
  }

  const isLoading = isLoadingDocument || isLoadingVersions

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
        title={document.name}
        description={`Uploaded on ${formatDate(document.date)}`}
        actionLabel="New Version"
        onAction={() => router.push(`/documents/${documentUuid}/new-version`)}
        actionDisabled={!hasBucket}
        actionDisabledReason="Organization does not have storage configured"
      />

      {/* Document Info */}
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Main Content - Versions */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-700">
              <Subheading>Version History</Subheading>
              <Text className="mt-1">All versions of this document</Text>
            </div>

            {sortedVersions.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <CloudArrowUpIcon className="mx-auto size-12 text-zinc-400" />
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  No versions available
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {sortedVersions.map((version, index) => (
                  <li key={version.uuid} className="px-6 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">
                            {version.name}
                          </p>
                          {index === 0 && (
                            <Badge color="green">Latest</Badge>
                          )}
                          {version.uploadStatus !== 'COMPLETED' && (
                            <Badge color="amber">{version.uploadStatus}</Badge>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                          <span className="flex items-center gap-1">
                            <ClockIcon className="size-3.5" />
                            {formatDate(version.created)}
                          </span>
                          {version.size && (
                            <span>{formatFileSize(version.size)}</span>
                          )}
                          {version.mime && (
                            <span className="uppercase">{version.mime.split('/').pop()}</span>
                          )}
                        </div>
                        {version.description && (
                          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                            {version.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {version.uploadStatus === 'COMPLETED' ? (
                          <Button
                            outline
                            onClick={() => handleDownload(version.uuid, version.name)}
                          >
                            <ArrowDownTrayIcon className="size-4" />
                            Download
                          </Button>
                        ) : (
                          <span className="text-xs text-zinc-400">
                            {version.uploadStatus}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Sidebar - Document Details */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-700">
              <Subheading>Details</Subheading>
              {!isEditing ? (
                <Button outline onClick={handleStartEdit}>
                  <PencilIcon className="size-4" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button outline onClick={handleCancelEdit} disabled={isSaving}>
                    <XMarkIcon className="size-4" />
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    <CheckIcon className="size-4" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              )}
            </div>
            <div className="px-6 py-4">
              <DescriptionList>
                <DescriptionTerm>Project</DescriptionTerm>
                <DescriptionDetails>
                  {project?.name ?? 'Unknown project'}
                </DescriptionDetails>

                <DescriptionTerm>Organization</DescriptionTerm>
                <DescriptionDetails>
                  {organization?.name ?? 'Unknown organization'}
                </DescriptionDetails>

                {document.mime && (
                  <>
                    <DescriptionTerm>Type</DescriptionTerm>
                    <DescriptionDetails className="uppercase">
                      {document.mime}
                    </DescriptionDetails>
                  </>
                )}

                <DescriptionTerm>Category</DescriptionTerm>
                <DescriptionDetails>
                  {isEditing ? (
                    <Select
                      value={editCategoryId?.toString() ?? ''}
                      onChange={(e) => setEditCategoryId(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">No category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id?.toString()}>
                          {cat.name}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    getCategoryName(document.categoryId) ?? <span className="text-zinc-400">None</span>
                  )}
                </DescriptionDetails>

                <DescriptionTerm>Created</DescriptionTerm>
                <DescriptionDetails>
                  {formatDate(document.date)}
                </DescriptionDetails>

                <DescriptionTerm>Storage</DescriptionTerm>
                <DescriptionDetails>
                  {hasBucket ? (
                    <Badge color="green">Configured</Badge>
                  ) : (
                    <Badge color="amber">Not configured</Badge>
                  )}
                </DescriptionDetails>
              </DescriptionList>
            </div>
          </div>

          {/* Tags */}
          <div className="mt-6 rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-700">
              <Subheading>Tags</Subheading>
            </div>
            <div className="px-6 py-4">
              {isEditing ? (
                <TagPicker
                  availableTags={allTags}
                  selectedSlugs={editTags}
                  onSelectionChange={setEditTags}
                  onCreateTag={handleCreateTag}
                  placeholder="Select tags..."
                  mode="popover"
                />
              ) : document.tags && document.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {document.tags.map((tagSlug: string) => (
                    <Badge key={tagSlug} color="zinc">
                      {getTagName(tagSlug)}
                    </Badge>
                  ))}
                </div>
              ) : (
                <Text className="text-zinc-400">No tags</Text>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 space-y-3">
            <Button
              className="w-full"
              outline
              onClick={() => router.push('/documents')}
            >
              <ArrowLeftIcon className="size-4" />
              Back to Documents
            </Button>
            <Button
              className="w-full"
              outline
              onClick={() => setShowDeleteDialog(true)}
            >
              <TrashIcon className="size-4 text-red-600 dark:text-red-400" />
              <span className="text-red-600 dark:text-red-400">Delete Document</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onClose={setShowDeleteDialog}>
        <DialogTitle>Delete Document</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete "{document.name}" and all of its versions? This action cannot be undone.
        </DialogDescription>
        <DialogBody>
          <Text>
            This will permanently delete:
          </Text>
          <ul className="mt-2 list-inside list-disc text-sm text-zinc-600 dark:text-zinc-400">
            <li>The document metadata</li>
            <li>{sortedVersions.length} version{sortedVersions.length !== 1 ? 's' : ''}</li>
            {hasBucket && <li>All stored files</li>}
          </ul>
        </DialogBody>
        <DialogActions>
          <Button outline onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button color="red" onClick={handleDelete} disabled={isDeleting}>
            <TrashIcon className="size-4" />
            {isDeleting ? 'Deleting...' : 'Delete Document'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  )
}
