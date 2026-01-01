'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import AppLayout from "@/components/app-layout"
import { Badge } from '@/components/badge'
import { Input } from '@/components/input'
import { Button } from '@/components/button'
import {
  FolderIcon,
  DocumentIcon,
  TagIcon,
  Cog6ToothIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'
import {
  useGetApiV1ProjectsUuidUuid,
} from '@/lib/api/generated/projects/projects'
import {
  useGetApiV1Categories,
  usePostApiV1Categories,
  usePutApiV1CategoriesId,
  useDeleteApiV1CategoriesId,
  getGetApiV1CategoriesQueryKey,
} from '@/lib/api/generated/categories/categories'
import { useGetApiV1Documents } from '@/lib/api/generated/documents/documents'
import { useGetApiV1Organizations } from '@/lib/api/generated/organizations/organizations'
import { useGetApiV1Tags } from '@/lib/api/generated/tags/tags'
import type { DocumentDTO, CategoryDTO, OrganizationDTO, TagDTO } from '@/lib/api/models'

type TabType = 'overview' | 'documents' | 'categories' | 'settings'

const TABS: { id: TabType; name: string; icon: typeof FolderIcon }[] = [
  { id: 'overview', name: 'Overview', icon: FolderIcon },
  { id: 'documents', name: 'Documents', icon: DocumentIcon },
  { id: 'categories', name: 'Categories', icon: TagIcon },
  { id: 'settings', name: 'Settings', icon: Cog6ToothIcon },
]

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const projectUuid = params.uuid as string

  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)
  const [editingCategoryName, setEditingCategoryName] = useState('')
  const [isAddingCategory, setIsAddingCategory] = useState(false)

  // Fetch project details
  const { data: project, isLoading: isLoadingProject, error: projectError } = useGetApiV1ProjectsUuidUuid(
    projectUuid,
    { query: { enabled: !!projectUuid } }
  )

  // Fetch categories for this project
  const { data: categoriesResponse, isLoading: isLoadingCategories } = useGetApiV1Categories(
    { projectId: project?.id },
    { query: { enabled: !!project?.id } }
  )

  // Fetch documents for this project
  const { data: documentsResponse, isLoading: isLoadingDocuments } = useGetApiV1Documents(
    { projectId: project?.id },
    { query: { enabled: !!project?.id } }
  )

  // Fetch organizations for display
  const { data: orgsResponse } = useGetApiV1Organizations()

  // Fetch tags for display
  const { data: tagsResponse } = useGetApiV1Tags()

  // Mutations
  const createCategoryMutation = usePostApiV1Categories()
  const updateCategoryMutation = usePutApiV1CategoriesId()
  const deleteCategoryMutation = useDeleteApiV1CategoriesId()

  // Parse responses
  const categories: CategoryDTO[] = useMemo(() => {
    if (!categoriesResponse) return []
    if (Array.isArray(categoriesResponse)) return categoriesResponse
    if ('content' in categoriesResponse) return (categoriesResponse as { content: CategoryDTO[] }).content
    return [categoriesResponse]
  }, [categoriesResponse])

  const documents: DocumentDTO[] = useMemo(() => {
    if (!documentsResponse) return []
    if (Array.isArray(documentsResponse)) return documentsResponse
    if ('content' in documentsResponse) return (documentsResponse as { content: DocumentDTO[] }).content
    return [documentsResponse]
  }, [documentsResponse])

  const organizations: OrganizationDTO[] = useMemo(() => {
    if (!orgsResponse) return []
    if (Array.isArray(orgsResponse)) return orgsResponse
    if ('content' in orgsResponse) return (orgsResponse as { content: OrganizationDTO[] }).content
    return [orgsResponse]
  }, [orgsResponse])

  const allTags: TagDTO[] = useMemo(() => {
    if (!tagsResponse) return []
    if (Array.isArray(tagsResponse)) return tagsResponse
    if ('content' in tagsResponse) return (tagsResponse as { content: TagDTO[] }).content
    return [tagsResponse]
  }, [tagsResponse])

  const organization = organizations.find(o => o.id === project?.organizationId)

  const getTagName = (slug: string) => {
    const tag = allTags.find(t => t.slug === slug)
    return tag?.name ?? slug
  }

  // Category handlers
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !project?.id) return
    try {
      await createCategoryMutation.mutateAsync({
        data: { name: newCategoryName.trim(), projectId: project.id }
      })
      await queryClient.invalidateQueries({ queryKey: getGetApiV1CategoriesQueryKey({ projectId: project.id }) })
      setNewCategoryName('')
      setIsAddingCategory(false)
    } catch (error) {
      console.error('Failed to create category:', error)
    }
  }

  const handleUpdateCategory = async (categoryId: number) => {
    if (!editingCategoryName.trim()) return
    try {
      await updateCategoryMutation.mutateAsync({
        id: categoryId,
        data: { name: editingCategoryName.trim() }
      })
      await queryClient.invalidateQueries({ queryKey: getGetApiV1CategoriesQueryKey({ projectId: project?.id }) })
      setEditingCategoryId(null)
      setEditingCategoryName('')
    } catch (error) {
      console.error('Failed to update category:', error)
    }
  }

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return
    try {
      await deleteCategoryMutation.mutateAsync({ id: categoryId })
      await queryClient.invalidateQueries({ queryKey: getGetApiV1CategoriesQueryKey({ projectId: project?.id }) })
    } catch (error) {
      console.error('Failed to delete category:', error)
    }
  }

  const startEditingCategory = (category: CategoryDTO) => {
    setEditingCategoryId(category.id ?? null)
    setEditingCategoryName(category.name)
  }

  const cancelEditingCategory = () => {
    setEditingCategoryId(null)
    setEditingCategoryName('')
  }

  if (isLoadingProject) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="size-8 animate-spin rounded-full border-4 border-zinc-300 border-t-indigo-600 dark:border-zinc-600 dark:border-t-indigo-400" />
        </div>
      </AppLayout>
    )
  }

  if (projectError || !project) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600 dark:text-red-400">
            Failed to load project. Please try again.
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <FolderIcon className="size-8 text-indigo-600 dark:text-indigo-400" />
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {project.name}
                </h1>
              </div>
              {project.description && (
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-400">
                  {project.description}
                </p>
              )}
              {organization && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">
                  {organization.name}
                </p>
              )}
            </div>
            <Button onClick={() => router.push(`/projects/${projectUuid}/edit`)}>
              Edit Project
            </Button>
          </div>

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {project.tags.map((tagSlug) => (
                <Badge key={tagSlug} color="indigo">
                  {getTagName(tagSlug)}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
                } flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium`}
              >
                <tab.icon className="size-5" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Project Stats */}
              <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-white/5">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Project Stats</h3>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Documents</dt>
                    <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                      {isLoadingDocuments ? '...' : documents.length}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Categories</dt>
                    <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                      {isLoadingCategories ? '...' : categories.length}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Tags</dt>
                    <dd className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                      {project.tags?.length ?? 0}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                    <dd className="mt-1">
                      <Badge color={project.isActive ? 'green' : 'red'}>
                        {project.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Recent Documents */}
              <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-white/5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Documents</h3>
                  <Button plain onClick={() => setActiveTab('documents')}>
                    View all
                  </Button>
                </div>
                {isLoadingDocuments ? (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">Loading...</div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No documents yet
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                    {documents.slice(0, 5).map((doc) => (
                      <li key={doc.uuid} className="py-3">
                        <a
                          href={`/documents/${doc.uuid}`}
                          className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 -mx-2 px-2 py-1 rounded"
                        >
                          <DocumentIcon className="size-5 text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-white truncate">
                            {doc.name}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Documents ({documents.length})
                </h2>
                <Button onClick={() => router.push(`/documents/new?projectId=${project.id}`)}>
                  <PlusIcon className="size-5" />
                  Upload Document
                </Button>
              </div>

              {isLoadingDocuments ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
              ) : documents.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg dark:bg-white/5">
                  <DocumentIcon className="mx-auto size-12 text-gray-400" />
                  <p className="mt-4 text-gray-500 dark:text-gray-400">
                    No documents yet. Upload your first document to get started.
                  </p>
                  <Button className="mt-4" onClick={() => router.push(`/documents/new?projectId=${project.id}`)}>
                    Upload Document
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-white/5">
                  <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                    {documents.map((doc) => {
                      const category = categories.find(c => c.id === doc.categoryId)
                      return (
                        <li key={doc.uuid}>
                          <a
                            href={`/documents/${doc.uuid}`}
                            className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <DocumentIcon className="size-8 flex-shrink-0 text-gray-400" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {doc.name}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                  {category && <span>{category.name}</span>}
                                  {doc.mime && (
                                    <>
                                      {category && <span>-</span>}
                                      <span className="uppercase">{doc.mime.split('/').pop()}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            {doc.tags && doc.tags.length > 0 && (
                              <div className="flex gap-1 flex-shrink-0">
                                {doc.tags.slice(0, 2).map((tagSlug: string) => (
                                  <Badge key={tagSlug} color="zinc">
                                    {getTagName(tagSlug)}
                                  </Badge>
                                ))}
                                {doc.tags.length > 2 && (
                                  <span className="text-xs text-gray-500">+{doc.tags.length - 2}</span>
                                )}
                              </div>
                            )}
                          </a>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Categories ({categories.length})
                </h2>
                {!isAddingCategory && (
                  <Button onClick={() => setIsAddingCategory(true)}>
                    <PlusIcon className="size-5" />
                    Add Category
                  </Button>
                )}
              </div>

              {/* Add Category Form */}
              {isAddingCategory && (
                <div className="mb-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-white/5">
                  <Input
                    type="text"
                    placeholder="Category name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateCategory()
                      if (e.key === 'Escape') {
                        setIsAddingCategory(false)
                        setNewCategoryName('')
                      }
                    }}
                    autoFocus
                    className="flex-1"
                  />
                  <Button
                    onClick={handleCreateCategory}
                    disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
                  >
                    <CheckIcon className="size-5" />
                  </Button>
                  <Button
                    plain
                    onClick={() => {
                      setIsAddingCategory(false)
                      setNewCategoryName('')
                    }}
                  >
                    <XMarkIcon className="size-5" />
                  </Button>
                </div>
              )}

              {isLoadingCategories ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
              ) : categories.length === 0 && !isAddingCategory ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg dark:bg-white/5">
                  <TagIcon className="mx-auto size-12 text-gray-400" />
                  <p className="mt-4 text-gray-500 dark:text-gray-400">
                    No categories yet. Create categories to organize your documents.
                  </p>
                  <Button className="mt-4" onClick={() => setIsAddingCategory(true)}>
                    <PlusIcon className="size-5" />
                    Add Category
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-white/5">
                  <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                    {categories.map((category) => {
                      const docCount = documents.filter(d => d.categoryId === category.id).length
                      const isEditing = editingCategoryId === category.id

                      return (
                        <li key={category.id} className="flex items-center justify-between gap-4 px-4 py-3">
                          {isEditing ? (
                            <div className="flex flex-1 items-center gap-2">
                              <Input
                                type="text"
                                value={editingCategoryName}
                                onChange={(e) => setEditingCategoryName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleUpdateCategory(category.id!)
                                  if (e.key === 'Escape') cancelEditingCategory()
                                }}
                                autoFocus
                                className="flex-1"
                              />
                              <Button
                                onClick={() => handleUpdateCategory(category.id!)}
                                disabled={!editingCategoryName.trim() || updateCategoryMutation.isPending}
                              >
                                <CheckIcon className="size-5" />
                              </Button>
                              <Button plain onClick={cancelEditingCategory}>
                                <XMarkIcon className="size-5" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-3">
                                <TagIcon className="size-5 text-gray-400" />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {category.name}
                                </span>
                                <Badge color="zinc">{docCount} docs</Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => startEditingCategory(category)}
                                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                  title="Edit"
                                >
                                  <PencilIcon className="size-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(category.id!)}
                                  className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                  title="Delete"
                                  disabled={deleteCategoryMutation.isPending}
                                >
                                  <TrashIcon className="size-4" />
                                </button>
                              </div>
                            </>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Project Settings
              </h2>
              <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-white/5">
                <dl className="divide-y divide-gray-100 dark:divide-gray-800">
                  <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-900 dark:text-white">Name</dt>
                    <dd className="mt-1 text-sm text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">
                      {project.name}
                    </dd>
                  </div>
                  <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-900 dark:text-white">Description</dt>
                    <dd className="mt-1 text-sm text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">
                      {project.description || 'No description'}
                    </dd>
                  </div>
                  <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-900 dark:text-white">Organization</dt>
                    <dd className="mt-1 text-sm text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">
                      {organization?.name || 'Unknown'}
                    </dd>
                  </div>
                  <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-900 dark:text-white">Status</dt>
                    <dd className="mt-1 text-sm sm:col-span-2 sm:mt-0">
                      <Badge color={project.isActive ? 'green' : 'red'}>
                        {project.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </dd>
                  </div>
                  <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-900 dark:text-white">Created</dt>
                    <dd className="mt-1 text-sm text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </dd>
                  </div>
                  <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-900 dark:text-white">Last Modified</dt>
                    <dd className="mt-1 text-sm text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">
                      {new Date(project.modifiedAt).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Danger Zone */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-red-600 dark:text-red-400 mb-4">Danger Zone</h3>
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/10">
                  <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                    Deleting this project will remove all associated documents and categories. This action cannot be undone.
                  </p>
                  <Button
                    color="red"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
                        // TODO: Implement delete project
                        alert('Delete project functionality coming soon')
                      }
                    }}
                  >
                    <TrashIcon className="size-5" />
                    Delete Project
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
