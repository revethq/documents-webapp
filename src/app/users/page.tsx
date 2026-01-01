'use client'

import AppLayout from "@/components/app-layout";
import PageHeader from "@/components/page-header";
import EmptyState from "@/components/empty-state";
import { Link } from "@/components/link";
import { EnvelopeIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

import type { UserDTO } from '@/lib/api/models';

export default function UsersPage() {
  // TODO: Fetch users from API
  const users: UserDTO[] = [];

  return (
    <AppLayout>
      <PageHeader
        title="Users"
        description="Manage users and send invitations to join your organizations."
        actionLabel="Invite user"
        onAction={() => console.log("Invite user")}
      />

      {users.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={EnvelopeIcon}
            title="No users"
            description="Get started by inviting users to join your organization."
            actionLabel="Invite User"
            onAction={() => console.log("Invite user")}
          />
        </div>
      ) : (
        <div className="mt-8">
          <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user) => (
              <li key={user.id} className="flex items-center justify-between gap-x-6 py-5">
                <div className="flex min-w-0 gap-x-4">
                  <Image
                    alt=""
                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=4f46e5&color=fff`}
                    className="h-12 w-12 flex-none rounded-full bg-gray-50 dark:bg-gray-800"
                    width={48}
                    height={48}
                  />
                  <div className="min-w-0 flex-auto">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      <Link href={`/users/${user.id}`} className="hover:underline">
                        {user.name}
                      </Link>
                    </p>
                    <p className="mt-1 flex text-xs text-gray-500 dark:text-gray-400">
                      <span className="truncate">{user.email}</span>
                    </p>
                    {user.title && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{user.title}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-none items-center gap-x-4">
                  <div className="hidden sm:flex sm:flex-col sm:items-end">
                    <div className="flex gap-x-1.5">
                      {user.organizations?.map((org: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10 dark:bg-indigo-400/10 dark:text-indigo-400 dark:ring-indigo-400/30"
                        >
                          {org}
                        </span>
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {user.projectCount} projects
                    </p>
                  </div>
                  <Link
                    href={`/users/${user.id}`}
                    className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-white/10 dark:text-white dark:ring-0 dark:hover:bg-white/20"
                  >
                    View
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </AppLayout>
  );
}
