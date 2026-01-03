'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import AppLayout from '@/components/app-layout'
import { Select } from '@/components/select'
import {
  useGetApiV1UsersUuid,
  usePutApiV1UsersUuid,
} from '@/lib/api/generated/users/users'
import {
  useDeleteApiV1OrganizationPermissionsId,
  useDeleteApiV1OrganizationPermissionsOrganizationsOrganizationIdUsersUserId,
  useGetApiV1OrganizationPermissions,
  usePostApiV1OrganizationPermissionsOrganizationsOrganizationIdGrant,
  usePutApiV1OrganizationPermissionsId,
} from '@/lib/api/generated/organization-permissions/organization-permissions'
import {
  useDeleteApiV1ProjectPermissionsId,
  useDeleteApiV1ProjectPermissionsProjectsProjectIdUsersUserId,
  useGetApiV1ProjectPermissions,
  usePostApiV1ProjectPermissionsProjectsProjectIdGrant,
  usePutApiV1ProjectPermissionsId,
} from '@/lib/api/generated/project-permissions/project-permissions'
import { useGetApiV1Organizations } from '@/lib/api/generated/organizations/organizations'
import { useGetApiV1Projects } from '@/lib/api/generated/projects/projects'
import type {
  OrganizationDTO,
  OrganizationPermissionDTO,
  ProjectDTO,
  ProjectPermissionDTO,
  UpdateUserRequest,
  UserDTO,
} from '@/lib/api/models'
import { PermissionType } from '@/lib/api/models'

interface UserFormData {
  username: string
  email: string
  firstName: string
  lastName: string
  title: string
  timezone: string
  phoneOffice: string
  phoneMobile: string
  phoneFax: string
  phoneExt: string
  accessNewProjects: boolean
  isActive: boolean
  isStaff: boolean
  isSuperuser: boolean
}

const initialFormData: UserFormData = {
  username: '',
  email: '',
  firstName: '',
  lastName: '',
  title: '',
  timezone: '',
  phoneOffice: '',
  phoneMobile: '',
  phoneFax: '',
  phoneExt: '',
  accessNewProjects: false,
  isActive: true,
  isStaff: false,
  isSuperuser: false,
}

type TabType = 'profile' | 'permissions'

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const userUuid = params.uuid as string

  const [activeTab, setActiveTab] = useState<TabType>('profile')
  const [formData, setFormData] = useState<UserFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedOrganizationId, setSelectedOrganizationId] = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [selectedOrgPermission, setSelectedOrgPermission] = useState<PermissionType>(
    PermissionType.CAN_CREATE
  )
  const [selectedProjectPermission, setSelectedProjectPermission] = useState<PermissionType>(
    PermissionType.CAN_CREATE
  )

  const { data: userData, isLoading, error } = useGetApiV1UsersUuid(userUuid, {
    query: { enabled: !!userUuid },
  })
  const updateMutation = usePutApiV1UsersUuid()

  const isPermissionsTab = activeTab === 'permissions'
  const userId = userData?.id ?? null

  const { data: orgPermissionsResponse, isLoading: isLoadingOrgPermissions } =
    useGetApiV1OrganizationPermissions(userId ? { userId } : undefined, {
      query: { enabled: isPermissionsTab && !!userId },
    })
  const { data: projectPermissionsResponse, isLoading: isLoadingProjectPermissions } =
    useGetApiV1ProjectPermissions(userId ? { userId } : undefined, {
      query: { enabled: isPermissionsTab && !!userId },
    })

  const { data: organizationsResponse, isLoading: isLoadingOrganizations } =
    useGetApiV1Organizations(undefined, {
      query: { enabled: isPermissionsTab },
    })
  const { data: projectsResponse, isLoading: isLoadingProjects } = useGetApiV1Projects(
    undefined,
    {
      query: { enabled: isPermissionsTab },
    }
  )

  const grantOrganizationPermission =
    usePostApiV1OrganizationPermissionsOrganizationsOrganizationIdGrant()
  const updateOrganizationPermission = usePutApiV1OrganizationPermissionsId()
  const revokeOrganizationPermissionById = useDeleteApiV1OrganizationPermissionsId()
  const revokeOrganizationPermission =
    useDeleteApiV1OrganizationPermissionsOrganizationsOrganizationIdUsersUserId()

  const grantProjectPermission = usePostApiV1ProjectPermissionsProjectsProjectIdGrant()
  const updateProjectPermission = usePutApiV1ProjectPermissionsId()
  const revokeProjectPermissionById = useDeleteApiV1ProjectPermissionsId()
  const revokeProjectPermission =
    useDeleteApiV1ProjectPermissionsProjectsProjectIdUsersUserId()

  useEffect(() => {
    if (!userData) return
    const user = userData as UserDTO
    setFormData({
      username: user.username,
      email: user.email,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      title: user.title ?? '',
      timezone: user.timezone ?? '',
      phoneOffice: user.phoneOffice ?? '',
      phoneMobile: user.phoneMobile ?? '',
      phoneFax: user.phoneFax ?? '',
      phoneExt: user.phoneExt ?? '',
      accessNewProjects: Boolean(user.accessNewProjects),
      isActive: Boolean(user.isActive),
      isStaff: Boolean(user.isStaff),
      isSuperuser: Boolean(user.isSuperuser),
    })
  }, [userData])

  const organizations = useMemo(() => {
    if (!organizationsResponse) return []
    if (Array.isArray(organizationsResponse)) return organizationsResponse
    if ('content' in organizationsResponse) {
      return (organizationsResponse as { content: OrganizationDTO[] }).content
    }
    return [organizationsResponse]
  }, [organizationsResponse])

  const projects = useMemo(() => {
    if (!projectsResponse) return []
    if (Array.isArray(projectsResponse)) return projectsResponse
    if ('content' in projectsResponse) return (projectsResponse as { content: ProjectDTO[] }).content
    return [projectsResponse]
  }, [projectsResponse])

  const orgPermissions = useMemo(() => {
    if (!orgPermissionsResponse) return []
    if (Array.isArray(orgPermissionsResponse)) return orgPermissionsResponse
    if ('content' in orgPermissionsResponse) {
      return (orgPermissionsResponse as { content: OrganizationPermissionDTO[] }).content
    }
    return [orgPermissionsResponse]
  }, [orgPermissionsResponse])

  const projectPermissions = useMemo(() => {
    if (!projectPermissionsResponse) return []
    if (Array.isArray(projectPermissionsResponse)) return projectPermissionsResponse
    if ('content' in projectPermissionsResponse) {
      return (projectPermissionsResponse as { content: ProjectPermissionDTO[] }).content
    }
    return [projectPermissionsResponse]
  }, [projectPermissionsResponse])

  const assignedOrganizationIds = useMemo(() => {
    const ids = new Set<number>()
    orgPermissions.forEach((permission) => {
      if (permission.organizationId != null) {
        ids.add(permission.organizationId)
      }
    })
    return ids
  }, [orgPermissions])

  const assignedProjectIds = useMemo(() => {
    const ids = new Set<number>()
    projectPermissions.forEach((permission) => {
      if (permission.projectId != null) {
        ids.add(permission.projectId)
      }
    })
    return ids
  }, [projectPermissions])

  const availableOrganizations = useMemo(() => {
    return organizations.filter(
      (organization) => organization.id != null && !assignedOrganizationIds.has(organization.id)
    )
  }, [organizations, assignedOrganizationIds])

  const availableProjects = useMemo(() => {
    return projects.filter((project) => project.id != null && !assignedProjectIds.has(project.id))
  }, [projects, assignedProjectIds])

  const organizationById = useMemo(() => {
    const map = new Map<number, OrganizationDTO>()
    organizations.forEach((organization) => {
      if (organization.id != null) {
        map.set(organization.id, organization)
      }
    })
    return map
  }, [organizations])

  const projectById = useMemo(() => {
    const map = new Map<number, ProjectDTO>()
    projects.forEach((project) => {
      if (project.id != null) {
        map.set(project.id, project)
      }
    })
    return map
  }, [projects])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const payload: UpdateUserRequest = {
        email: formData.email || null,
        firstName: formData.firstName || null,
        lastName: formData.lastName || null,
        title: formData.title || null,
        timezone: formData.timezone || null,
        phoneOffice: formData.phoneOffice || null,
        phoneMobile: formData.phoneMobile || null,
        phoneFax: formData.phoneFax || null,
        phoneExt: formData.phoneExt || null,
        accessNewProjects: formData.accessNewProjects,
        isActive: formData.isActive,
        isStaff: formData.isStaff,
        isSuperuser: formData.isSuperuser,
      }

      await updateMutation.mutateAsync({ uuid: userUuid, data: payload })
      await queryClient.invalidateQueries({
        predicate: (query) =>
          typeof query.queryKey[0] === 'string' && query.queryKey[0].includes('/api/v1/users'),
      })
    } catch (submitError) {
      console.error('Failed to update user:', submitError)
    } finally {
      setIsSubmitting(false)
    }
  }

  const refreshPermissions = async () => {
    await queryClient.invalidateQueries({
      predicate: (query) =>
        typeof query.queryKey[0] === 'string' &&
        (query.queryKey[0].includes('/api/v1/organization-permissions') ||
          query.queryKey[0].includes('/api/v1/project-permissions')),
    })
  }

  const handleGrantOrganizationPermission = async () => {
    if (!userId || !selectedOrganizationId) return
    try {
      await grantOrganizationPermission.mutateAsync({
        organizationId: Number(selectedOrganizationId),
        data: { userId, permission: selectedOrgPermission },
      })
      await refreshPermissions()
      setSelectedOrganizationId('')
    } catch (grantError) {
      console.error('Failed to grant organization permission:', grantError)
    }
  }

  const handleUpdateOrganizationPermission = async (
    permission: OrganizationPermissionDTO,
    newPermission: PermissionType
  ) => {
    if (!permission.id) return
    try {
      await updateOrganizationPermission.mutateAsync({
        id: permission.id,
        data: { permission: newPermission },
      })
      await refreshPermissions()
    } catch (updateError) {
      console.error('Failed to update organization permission:', updateError)
    }
  }

  const handleRevokeOrganizationPermission = async (permission: OrganizationPermissionDTO) => {
    try {
      if (permission.id) {
        await revokeOrganizationPermissionById.mutateAsync({ id: permission.id })
      } else if (permission.organizationId && userId) {
        await revokeOrganizationPermission.mutateAsync({
          organizationId: permission.organizationId,
          userId,
        })
      }
      await refreshPermissions()
    } catch (revokeError) {
      console.error('Failed to revoke organization permission:', revokeError)
    }
  }

  const handleGrantProjectPermission = async () => {
    if (!userId || !selectedProjectId) return
    try {
      await grantProjectPermission.mutateAsync({
        projectId: Number(selectedProjectId),
        data: { userId, permission: selectedProjectPermission },
      })
      await refreshPermissions()
      setSelectedProjectId('')
    } catch (grantError) {
      console.error('Failed to grant project permission:', grantError)
    }
  }

  const handleUpdateProjectPermission = async (
    permission: ProjectPermissionDTO,
    newPermission: PermissionType
  ) => {
    if (!permission.id) return
    try {
      await updateProjectPermission.mutateAsync({
        id: permission.id,
        data: { permission: newPermission },
      })
      await refreshPermissions()
    } catch (updateError) {
      console.error('Failed to update project permission:', updateError)
    }
  }

  const handleRevokeProjectPermission = async (permission: ProjectPermissionDTO) => {
    try {
      if (permission.id) {
        await revokeProjectPermissionById.mutateAsync({ id: permission.id })
      } else if (permission.projectId && userId) {
        await revokeProjectPermission.mutateAsync({
          projectId: permission.projectId,
          userId,
        })
      }
      await refreshPermissions()
    } catch (revokeError) {
      console.error('Failed to revoke project permission:', revokeError)
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          Loading user...
        </div>
      </AppLayout>
    )
  }

  if (error || !userData) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64 text-red-600 dark:text-red-400">
          Failed to load user. Please try again.
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {userData.fullName || userData.username}
          </h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-400">
            View and update user details.
          </p>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {(['profile', 'permissions'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${
                  tab === activeTab
                    ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
                } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium`}
              >
                {tab === 'profile' ? 'Profile' : 'Permissions'}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6">
          {activeTab === 'profile' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Username
                    </label>
                    <input
                      type="text"
                      disabled
                      value={formData.username}
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      First name
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(event) => setFormData({ ...formData, firstName: event.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Last name
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(event) => setFormData({ ...formData, lastName: event.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Timezone
                    </label>
                    <input
                      type="text"
                      value={formData.timezone}
                      onChange={(event) => setFormData({ ...formData, timezone: event.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      placeholder="America/New_York"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Office phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phoneOffice}
                      onChange={(event) => setFormData({ ...formData, phoneOffice: event.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Mobile phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phoneMobile}
                      onChange={(event) => setFormData({ ...formData, phoneMobile: event.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Fax
                    </label>
                    <input
                      type="tel"
                      value={formData.phoneFax}
                      onChange={(event) => setFormData({ ...formData, phoneFax: event.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Extension
                    </label>
                    <input
                      type="text"
                      value={formData.phoneExt}
                      onChange={(event) => setFormData({ ...formData, phoneExt: event.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={formData.accessNewProjects}
                      onChange={(event) =>
                        setFormData({ ...formData, accessNewProjects: event.target.checked })
                      }
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                    />
                    Allow access to new projects by default
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(event) => setFormData({ ...formData, isActive: event.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                    />
                    Active user
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={formData.isStaff}
                      onChange={(event) => setFormData({ ...formData, isStaff: event.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                    />
                    Staff access
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={formData.isSuperuser}
                      onChange={(event) =>
                        setFormData({ ...formData, isSuperuser: event.target.checked })
                      }
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
                    />
                    Superuser access
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/users')}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                >
                  Back to Users
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
          )}

          {activeTab === 'permissions' && (
            <div className="space-y-8">
              {!userId ? (
                <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  Permissions require a user ID, but this user does not have one assigned yet.
                </div>
              ) : (
                <>
                  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Organization Permissions
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Manage organization-level access for this user.
                        </p>
                      </div>
                      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                        <Select
                          value={selectedOrganizationId}
                          onChange={(event) => setSelectedOrganizationId(event.target.value)}
                          className="w-full sm:w-56"
                        >
                          <option value="">Select organization</option>
                          {availableOrganizations.map((organization) => (
                            <option key={organization.id ?? organization.uuid} value={organization.id ?? ''}>
                              {organization.name}
                            </option>
                          ))}
                        </Select>
                        <Select
                          value={selectedOrgPermission}
                          onChange={(event) =>
                            setSelectedOrgPermission(event.target.value as PermissionType)
                          }
                          className="w-full sm:w-48"
                        >
                          {Object.values(PermissionType).map((permission) => (
                            <option key={permission} value={permission}>
                              {permission.replace('CAN_', '')}
                            </option>
                          ))}
                        </Select>
                        <button
                          type="button"
                          onClick={handleGrantOrganizationPermission}
                          disabled={!selectedOrganizationId}
                          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                        >
                          Grant
                        </button>
                      </div>
                    </div>

                    <div className="mt-6">
                      {isLoadingOrgPermissions || isLoadingOrganizations ? (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Loading organization permissions...
                        </div>
                      ) : orgPermissions.length === 0 ? (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          No organization permissions assigned.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
                            <thead>
                              <tr>
                                <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-white">
                                  Organization
                                </th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-white">
                                  Permission
                                </th>
                                <th className="px-3 py-2 text-right font-semibold text-gray-900 dark:text-white">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                              {orgPermissions.map((permission) => (
                                <tr key={permission.id ?? `${permission.organizationId}-${permission.permission}`}>
                                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                                    {permission.organizationId
                                      ? organizationById.get(permission.organizationId)?.name ??
                                        `Organization ${permission.organizationId}`
                                      : 'Unknown organization'}
                                  </td>
                                  <td className="px-3 py-2">
                                    <Select
                                      value={permission.permission}
                                      onChange={(event) =>
                                        handleUpdateOrganizationPermission(
                                          permission,
                                          event.target.value as PermissionType
                                        )
                                      }
                                      className="w-36"
                                    >
                                      {Object.values(PermissionType).map((value) => (
                                        <option key={value} value={value}>
                                          {value.replace('CAN_', '')}
                                        </option>
                                      ))}
                                    </Select>
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleRevokeOrganizationPermission(permission)}
                                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                    >
                                      Remove
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Project Permissions
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Manage project-level access for this user.
                        </p>
                      </div>
                      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                        <Select
                          value={selectedProjectId}
                          onChange={(event) => setSelectedProjectId(event.target.value)}
                          className="w-full sm:w-56"
                        >
                          <option value="">Select project</option>
                          {availableProjects.map((project) => (
                            <option key={project.id ?? project.uuid} value={project.id ?? ''}>
                              {project.name}
                            </option>
                          ))}
                        </Select>
                        <Select
                          value={selectedProjectPermission}
                          onChange={(event) =>
                            setSelectedProjectPermission(event.target.value as PermissionType)
                          }
                          className="w-full sm:w-48"
                        >
                          {Object.values(PermissionType).map((permission) => (
                            <option key={permission} value={permission}>
                              {permission.replace('CAN_', '')}
                            </option>
                          ))}
                        </Select>
                        <button
                          type="button"
                          onClick={handleGrantProjectPermission}
                          disabled={!selectedProjectId}
                          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                        >
                          Grant
                        </button>
                      </div>
                    </div>

                    <div className="mt-6">
                      {isLoadingProjectPermissions || isLoadingProjects ? (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Loading project permissions...
                        </div>
                      ) : projectPermissions.length === 0 ? (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          No project permissions assigned.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
                            <thead>
                              <tr>
                                <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-white">
                                  Project
                                </th>
                                <th className="px-3 py-2 text-left font-semibold text-gray-900 dark:text-white">
                                  Permission
                                </th>
                                <th className="px-3 py-2 text-right font-semibold text-gray-900 dark:text-white">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                              {projectPermissions.map((permission) => (
                                <tr key={permission.id ?? `${permission.projectId}-${permission.permission}`}>
                                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                                    {permission.projectId
                                      ? projectById.get(permission.projectId)?.name ??
                                        `Project ${permission.projectId}`
                                      : 'Unknown project'}
                                  </td>
                                  <td className="px-3 py-2">
                                    <Select
                                      value={permission.permission}
                                      onChange={(event) =>
                                        handleUpdateProjectPermission(
                                          permission,
                                          event.target.value as PermissionType
                                        )
                                      }
                                      className="w-36"
                                    >
                                      {Object.values(PermissionType).map((value) => (
                                        <option key={value} value={value}>
                                          {value.replace('CAN_', '')}
                                        </option>
                                      ))}
                                    </Select>
                                  </td>
                                  <td className="px-3 py-2 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleRevokeProjectPermission(permission)}
                                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                    >
                                      Remove
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
