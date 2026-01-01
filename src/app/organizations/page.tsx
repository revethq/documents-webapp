'use client'

import { useRouter } from "next/navigation";
import AppLayout from "@/components/app-layout";
import PageHeader from "@/components/page-header";
import EmptyState from "@/components/empty-state";
import { Link } from "@/components/link";
import { BuildingOfficeIcon } from "@heroicons/react/24/outline";
import { useGetApiV1Organizations } from "@/lib/api/generated/organizations/organizations";
import type { OrganizationDTO } from "@/lib/api/models";

export default function OrganizationsPage() {
  const router = useRouter();
  const { data: organizationsResponse, isLoading, error } = useGetApiV1Organizations();

  // Handle PageDTO or array response
  const organizations: OrganizationDTO[] = organizationsResponse
    ? (Array.isArray(organizationsResponse) ? organizationsResponse : ('content' in organizationsResponse ? organizationsResponse.content as OrganizationDTO[] : [organizationsResponse]))
    : [];

  return (
    <AppLayout>
      <PageHeader
        title="Organizations"
        description="A list of all organizations you have access to including their name, location, and member count."
        actionLabel="Add organization"
        onAction={() => router.push('/organizations/new')}
      />

      {isLoading ? (
        <div className="mt-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent dark:border-indigo-400"></div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading organizations...</p>
        </div>
      ) : error ? (
        <div className="mt-8 rounded-md bg-red-50 p-4 dark:bg-red-900/10">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-400">Error loading organizations</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error instanceof Error ? error.message : 'An unknown error occurred'}</p>
              </div>
            </div>
          </div>
        </div>
      ) : organizations.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={BuildingOfficeIcon}
            title="No organizations"
            description="Get started by creating a new organization."
            actionLabel="New Organization"
            onAction={() => router.push('/organizations/new')}
          />
        </div>
      ) : (
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-0">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Location
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Members
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {Array.isArray(organizations) && organizations.map((org) => {
                    const location = [org.city, org.state, org.country].filter(Boolean).join(', ') || org.address || 'N/A';

                    return (
                      <tr key={org.uuid}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-0">
                          {org.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {location}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {/* TODO: Get member count from API */}
                          -
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                          <Link href={`/organizations/${org.uuid}`} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                            View<span className="sr-only">, {org.name}</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
