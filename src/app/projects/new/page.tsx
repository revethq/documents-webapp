'use client'

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import AppLayout from "@/components/app-layout";
import { usePostApiV1Projects, getGetApiV1ProjectsQueryKey } from "@/lib/api/generated/projects/projects";
import { useGetApiV1Organizations } from "@/lib/api/generated/organizations/organizations";
import type { OrganizationDTO } from "@/lib/api/models/organizationDTO";

export default function NewProjectPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const createProject = usePostApiV1Projects();
  const { data: orgsResponse, isLoading: orgsLoading } = useGetApiV1Organizations();

  const organizations = useMemo(
    () => (orgsResponse as unknown as OrganizationDTO[]) ?? [],
    [orgsResponse]
  );

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    organizationId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createProject.mutateAsync({
        data: {
          name: formData.name,
          description: formData.description || undefined,
          organizationId: formData.organizationId ? parseInt(formData.organizationId, 10) : undefined,
          clientIds: [],
          tags: [],
        }
      });

      await queryClient.invalidateQueries({ queryKey: getGetApiV1ProjectsQueryKey() });
      router.push('/projects');
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <AppLayout>
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Create New Project</h1>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-400">
            Add a new project to organize and manage documents.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Organization */}
          <div>
            <label htmlFor="organizationId" className="block text-sm font-medium text-gray-900 dark:text-white">
              Organization <span className="text-red-500">*</span>
            </label>
            <select
              name="organizationId"
              id="organizationId"
              required
              value={formData.organizationId}
              onChange={handleChange}
              disabled={orgsLoading}
              className="mt-2 block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm dark:bg-white/5 dark:text-white dark:ring-white/10 dark:focus:ring-indigo-500 disabled:opacity-50"
            >
              <option value="">Select an organization</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id ?? ''}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          {/* Name - Required */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-900 dark:text-white">
              Project Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              id="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="mt-2 block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm dark:bg-white/5 dark:text-white dark:ring-white/10 dark:focus:ring-indigo-500"
              placeholder="My Project"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-900 dark:text-white">
              Description
            </label>
            <textarea
              name="description"
              id="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="mt-2 block w-full rounded-md border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm dark:bg-white/5 dark:text-white dark:ring-white/10 dark:focus:ring-indigo-500"
              placeholder="Brief description of the project"
            />
          </div>

          {/* Error Message */}
          {createProject.isError && (
            <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/10">
              <div className="text-sm text-red-800 dark:text-red-400">
                Failed to create project. Please try again.
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-x-4 border-t border-gray-200 pt-6 dark:border-gray-700">
            <button
              type="button"
              onClick={() => router.push('/projects')}
              className="rounded-md px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createProject.isPending || orgsLoading}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              {createProject.isPending ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
