'use client'

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/app-layout";
import PageHeader from "@/components/page-header";
import EmptyState from "@/components/empty-state";
import { FolderIcon } from "@heroicons/react/24/outline";
import { useGetApiV1Projects } from "@/lib/api/generated/projects/projects";
import { useGetApiV1Organizations } from "@/lib/api/generated/organizations/organizations";
import type { ProjectDTO } from "@/lib/api/models/projectDTO";
import type { OrganizationDTO } from "@/lib/api/models/organizationDTO";

export default function ProjectsPage() {
  const router = useRouter();
  const { data: projectsResponse, isLoading: projectsLoading, error: projectsError } = useGetApiV1Projects();
  const { data: orgsResponse, isLoading: orgsLoading } = useGetApiV1Organizations();

  // The API returns an array directly
  const projects = useMemo(
    () => (projectsResponse as unknown as ProjectDTO[]) ?? [],
    [projectsResponse]
  );

  const organizations = useMemo(
    () => (orgsResponse as unknown as OrganizationDTO[]) ?? [],
    [orgsResponse]
  );

  // Create a map of organization ID to organization for quick lookup
  const orgMap = useMemo(() => {
    const map = new Map<number, OrganizationDTO>();
    organizations.forEach((org) => {
      if (org.id != null) {
        map.set(org.id, org);
      }
    });
    return map;
  }, [organizations]);

  // Group projects by organization
  const projectsByOrg = useMemo(() => {
    const grouped = new Map<number | undefined, ProjectDTO[]>();

    projects.forEach((project) => {
      const orgId = project.organizationId;
      if (!grouped.has(orgId)) {
        grouped.set(orgId, []);
      }
      grouped.get(orgId)!.push(project);
    });

    return grouped;
  }, [projects]);

  const isLoading = projectsLoading || orgsLoading;

  if (isLoading) {
    return (
      <AppLayout>
        <PageHeader
          title="Projects"
          description="Browse and manage all projects across your organizations."
        />
        <div className="mt-8 flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400">Loading projects...</div>
        </div>
      </AppLayout>
    );
  }

  if (projectsError) {
    return (
      <AppLayout>
        <PageHeader
          title="Projects"
          description="Browse and manage all projects across your organizations."
        />
        <div className="mt-8 flex items-center justify-center">
          <div className="text-red-500">Failed to load projects. Please try again.</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Projects"
        description="Browse and manage all projects across your organizations."
        actionLabel="New project"
        onAction={() => router.push('/projects/new')}
      />

      {projects.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={FolderIcon}
            title="No projects"
            description="Get started by creating a new project within an organization."
            actionLabel="New Project"
            onAction={() => router.push('/projects/new')}
          />
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {Array.from(projectsByOrg.entries()).map(([orgId, orgProjects]) => {
            const org = orgId !== undefined ? orgMap.get(orgId) : undefined;
            const orgName = org?.name ?? "Uncategorized";

            return (
              <div key={orgId ?? "uncategorized"}>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {orgName}
                </h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {orgProjects.map((project) => (
                    <div
                      key={project.id}
                      className="relative flex flex-col rounded-lg border border-gray-300 bg-white p-6 shadow-sm hover:border-indigo-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-500"
                    >
                      <div className="flex items-center gap-x-3">
                        <FolderIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          <a href={`/projects/${project.id}/edit`} className="focus:outline-none">
                            <span className="absolute inset-0" aria-hidden="true" />
                            {project.name}
                          </a>
                        </h3>
                      </div>
                      {project.description && (
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                      {project.tags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {project.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 dark:bg-gray-700 dark:text-gray-300 dark:ring-gray-600"
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
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
