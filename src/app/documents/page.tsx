'use client'

import { useState, useMemo, useRef, useEffect, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import AppLayout from "@/components/app-layout"
import PageHeader from "@/components/page-header"
import EmptyState from "@/components/empty-state"
import { ErrorBanner } from "@/components/error-banner"
import { Link } from "@/components/link"
import { DocumentDuplicateIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from "@heroicons/react/24/outline"
import { getApiV1Documents, getGetApiV1DocumentsQueryKey, getGetApiV1DocumentsUuidDownloadQueryOptions } from '@/lib/api/generated/documents/documents'
import type { ProjectDTO, CategoryDTO, PageDTO, TagDTO, OrganizationDTO } from '@/lib/api/models'
import { useGetApiV1Projects } from '@/lib/api/generated/projects/projects'
import { useGetApiV1Categories } from '@/lib/api/generated/categories/categories'
import { useGetApiV1Tags } from '@/lib/api/generated/tags/tags'
import { useGetApiV1Organizations } from '@/lib/api/generated/organizations/organizations'
import { Input, InputGroup } from '@/components/input'
import { Select } from '@/components/select'
import { Badge } from '@/components/badge'
import { TagPicker } from '@/components/tag-picker'
import { getErrorMessage } from '@/lib/errors'

const PAGE_SIZE = 50

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export default function DocumentsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)
  const [selectedOrganizationUuid, setSelectedOrganizationUuid] = useState<string | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [selectedTagSlugs, setSelectedTagSlugs] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const parentRef = useRef<HTMLDivElement>(null)

  // Debounce search query to avoid too many API requests
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Build query params for API
  const queryParams = useMemo(() => ({
    size: PAGE_SIZE,
    ...(debouncedSearchQuery && { name: debouncedSearchQuery }),
    ...(selectedOrganizationUuid && { organizationId: [selectedOrganizationUuid] }),
    ...(selectedProjectId !== null && { projectId: selectedProjectId }),
    ...(selectedCategoryId !== null && { categoryId: selectedCategoryId }),
    ...(selectedTagSlugs.length > 0 && { tags: selectedTagSlugs }),
  }), [debouncedSearchQuery, selectedOrganizationUuid, selectedProjectId, selectedCategoryId, selectedTagSlugs])

  // Infinite query for documents with pagination
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: documentsLoading,
    error: documentsError,
  } = useInfiniteQuery({
    queryKey: getGetApiV1DocumentsQueryKey(queryParams),
    queryFn: async ({ pageParam = 0 }) => {
      const response = await getApiV1Documents({
        ...queryParams,
        page: pageParam,
      })
      return response
    },
    getNextPageParam: (lastPage: PageDTO) => {
      if (lastPage.hasMore) {
        return (lastPage.page ?? 0) + 1
      }
      return undefined
    },
    initialPageParam: 0,
  })

  // Flatten all pages into single array
  const allDocuments = useMemo(() => {
    return (
      data?.pages.flatMap(page =>
        Array.isArray(page?.content) ? page.content : []
      ).filter(Boolean) ?? []
    )
  }, [data])

  // Virtual list setup
  const virtualizer = useVirtualizer({
    count: hasNextPage ? allDocuments.length + 1 : allDocuments.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Estimated row height
    overscan: 5,
    isScrollingResetDelay: 0, // Workaround for flushSync error in v3.13.13
  })

  // Fetch next page when scrolling near the end
  useEffect(() => {
    const scrollElement = parentRef.current
    if (!scrollElement) return

    let scheduled = false

    const handleScroll = () => {
      if (scheduled) return

      const { scrollTop, scrollHeight, clientHeight } = scrollElement
      if (scrollHeight - scrollTop - clientHeight < 500 && hasNextPage && !isFetchingNextPage) {
        scheduled = true
        requestAnimationFrame(() => {
          scheduled = false
          startTransition(() => {
            fetchNextPage()
          })
        })
      }
    }

    scrollElement.addEventListener('scroll', handleScroll, { passive: true })
    return () => scrollElement.removeEventListener('scroll', handleScroll)
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Fetch projects for filter dropdown
  const { data: projectsResponse, error: projectsError } = useGetApiV1Projects()

  // Fetch categories, filtered by project if selected
  const { data: categoriesResponse, error: categoriesError } = useGetApiV1Categories(
    selectedProjectId !== null ? { projectId: selectedProjectId } : undefined
  )

  // Fetch all available tags from API
  const { data: tagsResponse, error: tagsError } = useGetApiV1Tags()

  // Fetch organizations to check bucket configuration
  const { data: organizationsResponse, error: organizationsError } = useGetApiV1Organizations()

  const projects = useMemo(() => {
    if (!projectsResponse) return []
    if (Array.isArray(projectsResponse)) return projectsResponse
    if ('content' in projectsResponse) return projectsResponse.content as ProjectDTO[]
    return [projectsResponse]
  }, [projectsResponse])

  const categories = useMemo(() => {
    if (!categoriesResponse) return []
    if (Array.isArray(categoriesResponse)) return categoriesResponse
    if ('content' in categoriesResponse) return categoriesResponse.content as CategoryDTO[]
    return [categoriesResponse]
  }, [categoriesResponse])

  const organizations = useMemo(() => {
    if (!organizationsResponse) return []
    if (Array.isArray(organizationsResponse)) return organizationsResponse
    if ('content' in organizationsResponse) return organizationsResponse.content as OrganizationDTO[]
    return [organizationsResponse]
  }, [organizationsResponse])

  // Get tags from API
  const availableTags = useMemo((): TagDTO[] => {
    if (!tagsResponse) return []
    if (Array.isArray(tagsResponse)) return tagsResponse
    if ('content' in tagsResponse) return tagsResponse.content as TagDTO[]
    return [tagsResponse]
  }, [tagsResponse])

  // Get tag name by slug for display (used for document tags)
  const getTagName = (slug: string) => {
    const tag = availableTags.find(t => t.slug === slug)
    return tag?.name ?? slug
  }

  const clearFilters = () => {
    setSelectedOrganizationUuid(null)
    setSelectedProjectId(null)
    setSelectedCategoryId(null)
    setSelectedTagSlugs([])
    setSearchQuery('')
  }

  const hasActiveFilters = selectedOrganizationUuid !== null || selectedProjectId !== null || selectedCategoryId !== null || selectedTagSlugs.length > 0 || searchQuery !== ''

  const getOrganizationName = (orgUuid?: string | null) => {
    if (!orgUuid) return 'Unknown organization'
    const org = organizations.find(o => o.uuid === orgUuid)
    return org?.name || 'Unknown organization'
  }

  const getProjectName = (projectId?: number) => {
    if (!projectId) return 'No project'
    const project = projects.find(p => p.id === projectId)
    return project?.name || 'Unknown project'
  }

  // Check if a document's organization has a bucket configured
  const hasOrgBucket = (projectId?: number): boolean => {
    if (!projectId) return false
    const project = projects.find(p => p.id === projectId)
    if (!project?.organizationId) return false
    const org = organizations.find(o => o.id === project.organizationId)
    return org?.bucketId != null
  }

  const getCategoryName = (categoryId?: number | null) => {
    if (!categoryId) return null
    const category = categories.find(c => c.id === categoryId)
    return category?.name
  }

  const handleDownload = async (documentUuid: string) => {
    try {
      const queryOptions = getGetApiV1DocumentsUuidDownloadQueryOptions(documentUuid)
      const response = await queryClient.fetchQuery(queryOptions)

      // Fetch the file from the presigned URL
      const fileResponse = await fetch(response.downloadUrl)
      const blob = await fileResponse.blob()

      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = response.fileName
      document.body.appendChild(a)
      a.click()

      // Cleanup
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      setActionError(getErrorMessage(error, 'Download failed. Please try again.'))
    }
  }

  const queryError =
    documentsError ||
    projectsError ||
    categoriesError ||
    tagsError ||
    organizationsError

  const errorMessage = actionError
    ? actionError
    : queryError
      ? getErrorMessage(queryError, 'Failed to load documents. Please try again.')
      : null

  return (
    <AppLayout>
      <PageHeader
        title="Documents"
        description="Search, browse, and manage all your accessible documents."
        actionLabel="Upload document"
        onAction={() => router.push('/documents/new')}
      />
      {errorMessage && (
        <ErrorBanner
          message={errorMessage}
          onDismiss={actionError ? () => setActionError(null) : undefined}
        />
      )}

      {/* Search and Filter Bar */}
      <div className="mt-6 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Search Input */}
          <div className="flex-1">
            <InputGroup>
              <MagnifyingGlassIcon data-slot="icon" />
              <Input
                type="search"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </InputGroup>
          </div>

          {/* Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
            }`}
          >
            <FunnelIcon className="size-5" />
            Filters
            {hasActiveFilters && (
              <span className="flex size-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                {[selectedOrganizationUuid, selectedProjectId, selectedCategoryId, ...selectedTagSlugs].filter(Boolean).length + (searchQuery ? 1 : 0)}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              <XMarkIcon className="size-4" />
              Clear all
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Organization Filter */}
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Organization
                </label>
                <Select
                  value={selectedOrganizationUuid ?? ''}
                  onChange={(e) => {
                    const value = e.target.value
                    setSelectedOrganizationUuid(value || null)
                    setSelectedProjectId(null)
                    setSelectedCategoryId(null)
                  }}
                >
                  <option value="">All organizations</option>
                  {organizations.map(org => (
                    <option key={org.uuid} value={org.uuid}>
                      {org.name}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Project Filter */}
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Project
                </label>
                <Select
                  value={selectedProjectId?.toString() ?? ''}
                  onChange={(e) => {
                    const value = e.target.value
                    setSelectedProjectId(value ? parseInt(value, 10) : null)
                    setSelectedCategoryId(null)
                  }}
                >
                  <option value="">All projects</option>
                  {projects.map(project => (
                    <option key={project.uuid} value={project.id?.toString()}>
                      {project.name}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Category
                </label>
                <Select
                  value={selectedCategoryId?.toString() ?? ''}
                  onChange={(e) => {
                    const value = e.target.value
                    setSelectedCategoryId(value ? parseInt(value, 10) : null)
                  }}
                  disabled={categories.length === 0}
                >
                  <option value="">All categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id?.toString()}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Tags Filter */}
              <div className="sm:col-span-2 lg:col-span-1">
                <TagPicker
                  availableTags={availableTags}
                  selectedSlugs={selectedTagSlugs}
                  onSelectionChange={setSelectedTagSlugs}
                  label="Tags"
                  placeholder="Select tags..."
                  mode="popover"
                />
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters && !showFilters && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Filters:</span>
            {searchQuery && (
              <Badge color="blue">
                Search: {searchQuery}
                <button onClick={() => setSearchQuery('')} className="ml-1">
                  <XMarkIcon className="size-3" />
                </button>
              </Badge>
            )}
            {selectedOrganizationUuid && (
              <Badge color="cyan">
                Organization: {getOrganizationName(selectedOrganizationUuid)}
                <button onClick={() => setSelectedOrganizationUuid(null)} className="ml-1">
                  <XMarkIcon className="size-3" />
                </button>
              </Badge>
            )}
            {selectedProjectId && (
              <Badge color="purple">
                Project: {getProjectName(selectedProjectId)}
                <button onClick={() => setSelectedProjectId(null)} className="ml-1">
                  <XMarkIcon className="size-3" />
                </button>
              </Badge>
            )}
            {selectedCategoryId && (
              <Badge color="amber">
                Category: {getCategoryName(selectedCategoryId)}
                <button onClick={() => setSelectedCategoryId(null)} className="ml-1">
                  <XMarkIcon className="size-3" />
                </button>
              </Badge>
            )}
            {selectedTagSlugs.map(slug => (
              <Badge key={slug} color="green">
                {getTagName(slug)}
                <button onClick={() => setSelectedTagSlugs(prev => prev.filter(s => s !== slug))} className="ml-1">
                  <XMarkIcon className="size-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Results Count */}
      {!documentsLoading && allDocuments.length > 0 && (
        <div className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          {searchQuery
            ? `Showing ${allDocuments.length} results for "${debouncedSearchQuery}"${hasNextPage ? ' (more available)' : ''}`
            : `${allDocuments.length} documents loaded${hasNextPage ? ' (more available)' : ''}`}
        </div>
      )}

      {/* Documents List */}
      {documentsLoading ? (
        <div className="mt-8 flex items-center justify-center py-12">
          <div className="size-8 animate-spin rounded-full border-4 border-zinc-300 border-t-blue-600 dark:border-zinc-600 dark:border-t-blue-400" />
        </div>
      ) : allDocuments.length === 0 ? (
        <div className="mt-8">
          {hasActiveFilters ? (
            <EmptyState
              icon={MagnifyingGlassIcon}
              title="No matching documents"
              description="Try adjusting your search or filter criteria."
              actionLabel="Clear Filters"
              onAction={clearFilters}
            />
          ) : (
            <EmptyState
              icon={ArrowUpTrayIcon}
              title="No documents"
              description="Get started by uploading your first document to a project."
              actionLabel="Upload Document"
              onAction={() => router.push('/documents/new')}
            />
          )}
        </div>
      ) : (
        <div
          ref={parentRef}
          className="mt-6 h-[calc(100vh-290px)] overflow-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const isLoaderRow = virtualRow.index >= allDocuments.length
              const document = allDocuments[virtualRow.index]

              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="bg-white dark:bg-zinc-900"
                >
                  {isLoaderRow ? (
                    <div className="flex h-full items-center justify-center">
                      <div className="size-6 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-600 dark:border-zinc-600 dark:border-t-blue-400" />
                      <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">Loading more...</span>
                    </div>
                  ) : document ? (
                    <div className="flex h-full items-center justify-between gap-x-5 border-b border-zinc-200 px-4 py-2 dark:border-zinc-700">
                      <div className="flex min-w-0 gap-x-3">
                        <DocumentDuplicateIcon className="size-10 flex-none rounded-lg bg-gray-50 p-2 text-gray-600 dark:bg-gray-800 dark:text-gray-400" />
                        <div className="min-w-0 flex-auto">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            <Link href={`/documents/${document.uuid}`} className="hover:underline">
                              {document.name}
                            </Link>
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="truncate">{getProjectName(document.projectId)}</span>
                            {document.categoryId && (
                              <>
                                <span>•</span>
                                <span>{getCategoryName(document.categoryId)}</span>
                              </>
                            )}
                            {document.mime && (
                              <>
                                <span>•</span>
                                <span className="uppercase">{document.mime.split('/').pop()}</span>
                              </>
                            )}
                          </div>
                          {document.tags && document.tags.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {document.tags.map((tagSlug: string) => (
                                <Badge key={tagSlug} color="zinc">
                                  {getTagName(tagSlug)}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-none items-center gap-x-3">
                        <div className="hidden sm:flex sm:flex-col sm:items-end">
                          <p className="text-sm text-gray-900 dark:text-white">
                            {formatDate(document.date)}
                          </p>
                        </div>
                        {hasOrgBucket(document.projectId) ? (
                          <button
                            type="button"
                            onClick={() => handleDownload(document.uuid)}
                            className="rounded-md bg-white p-1.5 text-gray-600 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover:text-gray-900 dark:bg-white/10 dark:text-gray-400 dark:ring-0 dark:hover:bg-white/20 dark:hover:text-white"
                            title="Download"
                          >
                            <ArrowDownTrayIcon className="size-5" />
                          </button>
                        ) : (
                          <span
                            className="cursor-not-allowed rounded-md bg-gray-100 p-1.5 text-gray-300 shadow-sm ring-1 ring-inset ring-gray-200 dark:bg-white/5 dark:text-gray-600 dark:ring-0"
                            title="Downloads disabled - organization does not have a storage bucket configured"
                          >
                            <ArrowDownTrayIcon className="size-5" />
                          </span>
                        )}
                        <Link
                          href={`/documents/${document.uuid}`}
                          className="rounded-md bg-white px-2.5 py-1 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:ring-0 dark:hover:bg-white/20"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
                      Document unavailable
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

    </AppLayout>
  )
}
