'use client'

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import AppLayout from "@/components/app-layout";
import { useGetApiV1OrganizationsUuidUuid, usePutApiV1OrganizationsId } from "@/lib/api/generated/organizations/organizations";
import { useGetApiV1Projects } from "@/lib/api/generated/projects/projects";
import { useGetApiV1Buckets } from "@/lib/api/generated/buckets/buckets";
import type { ProjectDTO, BucketDTO } from "@/lib/api/models";

type TabType = 'projects' | 'storage' | 'settings' | 'users';

// API returns 'active' but OpenAPI spec generates 'isActive' - handle both
interface BucketWithActive extends BucketDTO {
  active?: boolean;
}

function isBucketActive(bucket: BucketDTO): boolean {
  const b = bucket as BucketWithActive;
  // Check both field names since API returns 'active' but type has 'isActive'
  if (b.active !== undefined) return b.active;
  if (b.isActive !== undefined) return b.isActive;
  return true; // Default to active if neither field is present
}

const providerLabels: Record<string, string> = {
  S3: 'Amazon S3',
  GCS: 'Google Cloud Storage',
  AZURE_BLOB: 'Azure Blob Storage',
  MINIO: 'MinIO / S3-Compatible',
}

export default function OrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const orgUuid = params.id as string;
  const [activeTab, setActiveTab] = useState<TabType>('projects');

  // Fetch organization details
  const { data: orgData, isLoading: isLoadingOrg, error: orgError } = useGetApiV1OrganizationsUuidUuid(
    orgUuid,
    {
      query: {
        enabled: !!orgUuid,
      },
    }
  );

  // Fetch projects for this organization
  const { data: projectsData, isLoading: isLoadingProjects } = useGetApiV1Projects(
    { organizationId: orgData?.id },
    {
      query: {
        enabled: !!orgData?.id,
      },
    }
  );

  // Fetch all buckets
  const { data: bucketsResponse, isLoading: isLoadingBuckets } = useGetApiV1Buckets();
  const updateOrgMutation = usePutApiV1OrganizationsId();

  const buckets = useMemo(() => {
    if (!bucketsResponse) return [];
    if (Array.isArray(bucketsResponse)) return bucketsResponse;
    if ('content' in bucketsResponse) return (bucketsResponse as { content: BucketDTO[] }).content;
    return [bucketsResponse];
  }, [bucketsResponse]);

  const organization = orgData;
  const currentBucket = buckets.find(b => b.id === organization?.bucketId);
  // Handle PageDTO or array response
  const projects: ProjectDTO[] = projectsData
    ? (Array.isArray(projectsData) ? projectsData : ('content' in projectsData ? projectsData.content as ProjectDTO[] : [projectsData]))
    : [];

  const handleSelectBucket = async (bucketId: number | null) => {
    if (!organization?.id) return;
    try {
      await updateOrgMutation.mutateAsync({
        id: organization.id,
        data: { bucketId },
      });
      // Invalidate all organization queries to refresh the data
      await queryClient.invalidateQueries({ predicate: (query) => {
        const key = query.queryKey[0];
        return typeof key === 'string' && key.includes('/organizations');
      }});
    } catch (error) {
      console.error('Failed to update organization bucket:', error);
    }
  };

  if (isLoadingOrg) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-gray-400">Loading organization...</div>
        </div>
      </AppLayout>
    );
  }

  if (orgError || !organization) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-600 dark:text-red-400">
            Failed to load organization. Please try again.
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {organization.name}
              </h1>
              {organization.description && (
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-400">
                  {organization.description}
                </p>
              )}
            </div>
            <button
              onClick={() => router.push(`/organizations/${orgUuid}/edit`)}
              className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-white/5 dark:text-white dark:ring-white/10 dark:hover:bg-white/10"
            >
              Edit Organization
            </button>
          </div>

          {/* Organization Info */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3 text-sm">
            {organization.city && (
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Location</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">
                  {organization.city}
                  {organization.state && `, ${organization.state}`}
                </dd>
              </div>
            )}
            {organization.timezone && (
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Timezone</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">{organization.timezone}</dd>
              </div>
            )}
            {organization.locale && (
              <div>
                <dt className="font-medium text-gray-500 dark:text-gray-400">Locale</dt>
                <dd className="mt-1 text-gray-900 dark:text-white">{organization.locale}</dd>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('projects')}
              className={`${
                activeTab === 'projects'
                  ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
              } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium`}
            >
              Projects
            </button>
            <button
              onClick={() => setActiveTab('storage')}
              className={`${
                activeTab === 'storage'
                  ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
              } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium`}
            >
              Storage
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`${
                activeTab === 'settings'
                  ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
              } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium`}
            >
              Settings
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`${
                activeTab === 'users'
                  ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
              } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium`}
            >
              Users
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'projects' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Projects</h2>
                <button
                  onClick={() => router.push(`/projects/new?organizationId=${organization?.id}`)}
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                >
                  New Project
                </button>
              </div>

              {isLoadingProjects ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Loading projects...
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg dark:bg-white/5">
                  <p className="text-gray-500 dark:text-gray-400">
                    No projects yet. Create your first project to get started.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {projects.map((project: any) => (
                    <div
                      key={project.id}
                      onClick={() => router.push(`/projects/${project.uuid}`)}
                      className="cursor-pointer rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow dark:border-gray-700 dark:bg-white/5"
                    >
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      {project.tags && project.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {project.tags.slice(0, 3).map((tag: string) => (
                            <span
                              key={tag}
                              className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400"
                            >
                              {tag}
                            </span>
                          ))}
                          {project.tags.length > 3 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              +{project.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'storage' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Storage Configuration</h2>
                <a
                  href="/buckets"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                  Manage Buckets
                </a>
              </div>
              <div className="bg-white dark:bg-white/5 shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10 sm:rounded-xl">
                <div className="px-4 py-6 sm:p-8">
                  {isLoadingBuckets ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="size-6 animate-spin rounded-full border-2 border-zinc-300 border-t-indigo-600 dark:border-zinc-600 dark:border-t-indigo-400" />
                    </div>
                  ) : buckets.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">
                        No storage buckets available.
                      </p>
                      <a
                        href="/buckets"
                        className="mt-4 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                      >
                        Configure a Bucket
                      </a>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Active Storage Bucket
                      </label>
                      <select
                        value={organization.bucketId ?? ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleSelectBucket(value ? parseInt(value, 10) : null);
                        }}
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">No bucket configured</option>
                        {buckets.filter(b => b.isActive !== false).map((bucket) => (
                          <option key={bucket.id} value={bucket.id!}>
                            {bucket.name} ({providerLabels[bucket.provider] || bucket.provider})
                          </option>
                        ))}
                      </select>
                      {!currentBucket ? (
                        <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                          Document uploads and downloads are disabled until a storage bucket is configured.
                        </p>
                      ) : (
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                          Using bucket <span className="font-medium">{currentBucket.bucketName}</span>
                          {currentBucket.region && ` in ${currentBucket.region}`}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Organization Settings
              </h2>
              <div className="bg-white dark:bg-white/5 shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10 sm:rounded-xl">
                <div className="px-4 py-6 sm:p-8">
                  <dl className="divide-y divide-gray-100 dark:divide-gray-800">
                    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="text-sm font-medium text-gray-900 dark:text-white">Name</dt>
                      <dd className="mt-1 text-sm text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">
                        {organization.name}
                      </dd>
                    </div>
                    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="text-sm font-medium text-gray-900 dark:text-white">Description</dt>
                      <dd className="mt-1 text-sm text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">
                        {organization.description || 'N/A'}
                      </dd>
                    </div>
                    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="text-sm font-medium text-gray-900 dark:text-white">Address</dt>
                      <dd className="mt-1 text-sm text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">
                        {organization.address && (
                          <div>
                            <div>{organization.address}</div>
                            <div>
                              {organization.city}
                              {organization.state && `, ${organization.state}`}
                              {organization.zipCode && ` ${organization.zipCode}`}
                            </div>
                            {organization.country && <div>{organization.country}</div>}
                          </div>
                        )}
                        {!organization.address && 'N/A'}
                      </dd>
                    </div>
                    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="text-sm font-medium text-gray-900 dark:text-white">Phone</dt>
                      <dd className="mt-1 text-sm text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">
                        {organization.phone || 'N/A'}
                      </dd>
                    </div>
                    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="text-sm font-medium text-gray-900 dark:text-white">Fax</dt>
                      <dd className="mt-1 text-sm text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">
                        {organization.fax || 'N/A'}
                      </dd>
                    </div>
                    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="text-sm font-medium text-gray-900 dark:text-white">Website</dt>
                      <dd className="mt-1 text-sm text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">
                        {organization.website ? (
                          <a
                            href={organization.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                          >
                            {organization.website}
                          </a>
                        ) : (
                          'N/A'
                        )}
                      </dd>
                    </div>
                    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="text-sm font-medium text-gray-900 dark:text-white">Timezone</dt>
                      <dd className="mt-1 text-sm text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">
                        {organization.timezone}
                      </dd>
                    </div>
                    <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                      <dt className="text-sm font-medium text-gray-900 dark:text-white">Locale</dt>
                      <dd className="mt-1 text-sm text-gray-700 dark:text-gray-300 sm:col-span-2 sm:mt-0">
                        {organization.locale}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Users</h2>
                <button
                  onClick={() => {
                    // TODO: Implement invite user functionality
                    alert('Invite user functionality coming soon!');
                  }}
                  className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                >
                  Invite User
                </button>
              </div>

              <div className="text-center py-12 bg-gray-50 rounded-lg dark:bg-white/5">
                <p className="text-gray-500 dark:text-gray-400">
                  User management coming soon. You'll be able to invite users and manage permissions here.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
