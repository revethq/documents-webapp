'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Dialog, DialogBackdrop, DialogPanel, TransitionChild } from '@headlessui/react'
import { useAuth } from 'react-oidc-context'
import { useCapabilities } from '@/components/providers/capabilities-provider'
import { Link } from '@/components/link'
import {
  ArrowRightStartOnRectangleIcon,
  Bars3Icon,
  BuildingOfficeIcon,
  CircleStackIcon,
  DocumentDuplicateIcon,
  FolderIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

const allNavigation = [
  { name: 'Documents', href: '/documents', icon: DocumentDuplicateIcon, capability: 'documents:manage-documents' },
  { name: 'Organizations', href: '/organizations', icon: BuildingOfficeIcon, capability: 'documents:manage-organizations' },
  { name: 'Projects', href: '/projects', icon: FolderIcon, capability: 'documents:manage-projects' },
  { name: 'Storage', href: '/buckets', icon: CircleStackIcon, capability: 'documents:manage-buckets' },
  { name: 'Users', href: '/users', icon: UsersIcon, capability: 'documents:manage-users' },
  { name: 'Groups', href: '/groups', icon: UserGroupIcon, capability: 'documents:manage-groups' },
  { name: 'Policies', href: '/policies', icon: ShieldCheckIcon },
]


function isCurrentPath(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/'
  }
  return pathname.startsWith(href)
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const auth = useAuth()
  const { capabilities, error: capError } = useCapabilities()

  const navigation = allNavigation.filter((item) => {
    if (!item.capability) return true
    // On error, show all nav items (graceful degradation)
    if (capError) return true
    return capabilities.some((c) => c.id === item.capability && c.available)
  })
  const displayName =
    auth.user?.profile?.name ||
    auth.user?.profile?.preferred_username ||
    auth.user?.profile?.email ||
    'Account'

  return (
    <>
      <div>
        <Dialog open={sidebarOpen} onClose={setSidebarOpen} className="relative z-50 lg:hidden">
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-closed:opacity-0"
          />

          <div className="fixed inset-0 flex">
            <DialogPanel
              transition
              className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full"
            >
              <TransitionChild>
                <div className="absolute top-0 left-full flex w-16 justify-center pt-5 duration-300 ease-in-out data-closed:opacity-0">
                  <button type="button" onClick={() => setSidebarOpen(false)} className="-m-2.5 p-2.5">
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon aria-hidden="true" className="size-6 text-white" />
                  </button>
                </div>
              </TransitionChild>

              {/* Sidebar component, swap this element with another sidebar if you like */}
              <div className="relative flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2 pt-6 dark:bg-gray-900 dark:ring dark:ring-white/10 dark:before:pointer-events-none dark:before:absolute dark:before:inset-0 dark:before:bg-black/10">
                {/* User profile section at top */}
                <div className="relative flex items-center gap-x-3 pb-4">
                  <div className="size-12 shrink-0 rounded-full bg-gradient-to-br from-pink-400 to-pink-500 flex items-center justify-center text-white font-semibold text-lg">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      User
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {displayName}
                    </span>
                  </div>
                </div>

                <div className="relative border-t border-gray-200 dark:border-white/10" />

                <nav className="relative flex flex-1 flex-col">
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                        Main
                      </div>
                      <ul role="list" className="-mx-2 space-y-1">
                        {navigation.map((item) => (
                          <li key={item.name}>
                            <Link
                              href={item.href}
                              className={classNames(
                                isCurrentPath(pathname, item.href)
                                  ? 'bg-gray-50 text-indigo-600 dark:bg-white/5 dark:text-white'
                                  : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
                                'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                              )}
                            >
                              <item.icon
                                aria-hidden="true"
                                className={classNames(
                                  isCurrentPath(pathname, item.href)
                                    ? 'text-indigo-600 dark:text-white'
                                    : 'text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-white',
                                  'size-6 shrink-0',
                                )}
                              />
                              {item.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                    <li className="mt-auto -mx-2 pb-2">
                      <button
                        type="button"
                        onClick={() => auth.signoutRedirect()}
                        className="group flex w-full gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
                      >
                        <ArrowRightStartOnRectangleIcon
                          aria-hidden="true"
                          className="size-6 shrink-0 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-white"
                        />
                        Log out
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </DialogPanel>
          </div>
        </Dialog>

        {/* Static sidebar for desktop */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col dark:bg-gray-900">
          {/* Sidebar component, swap this element with another sidebar if you like */}
          <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pt-6 dark:border-white/10 dark:bg-black/10">
            {/* User profile section at top */}
            <div className="flex items-center gap-x-3 pb-4">
              <div className="size-12 shrink-0 rounded-full bg-gradient-to-br from-pink-400 to-pink-500 flex items-center justify-center text-white font-semibold text-lg">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  User
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {displayName}
                </span>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-white/10" />

            <nav className="flex flex-1 flex-col">
              <ul role="list" className="flex flex-1 flex-col gap-y-7">
                <li>
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                    Main
                  </div>
                  <ul role="list" className="-mx-2 space-y-1">
                    {navigation.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={classNames(
                            isCurrentPath(pathname, item.href)
                              ? 'bg-gray-50 text-indigo-600 dark:bg-white/5 dark:text-white'
                              : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white',
                            'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                          )}
                        >
                          <item.icon
                            aria-hidden="true"
                            className={classNames(
                              isCurrentPath(pathname, item.href)
                                ? 'text-indigo-600 dark:text-white'
                                : 'text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-white',
                              'size-6 shrink-0',
                            )}
                          />
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
                <li className="mt-auto -mx-2 pb-4">
                  <button
                    type="button"
                    onClick={() => auth.signoutRedirect()}
                    className="group flex w-full gap-x-3 rounded-md p-2 text-sm/6 font-semibold text-gray-700 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
                  >
                    <ArrowRightStartOnRectangleIcon
                      aria-hidden="true"
                      className="size-6 shrink-0 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-white"
                    />
                    Log out
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="sticky top-0 z-40 bg-white px-4 py-4 shadow-xs sm:px-6 lg:hidden dark:bg-gray-900 dark:shadow-none dark:after:pointer-events-none dark:after:absolute dark:after:inset-0 dark:after:border-b dark:after:border-white/10 dark:after:bg-black/10">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="-m-2.5 p-2.5 text-gray-700 hover:text-gray-900 lg:hidden dark:text-gray-400 dark:hover:text-white"
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon aria-hidden="true" className="size-6" />
            </button>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              {displayName}
            </div>
          </div>
        </div>

        <main className="py-10 lg:pl-72">
          <div className="px-4 sm:px-6 lg:px-8">
            {navigation.length === 0 && !capError ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <ShieldCheckIcon className="size-12 text-gray-400 dark:text-gray-500" />
                <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                  No access
                </h2>
                <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
                  Your account doesn&apos;t have access to any features yet. Contact your
                  administrator to get permissions assigned.
                </p>
                <button
                  type="button"
                  onClick={() => auth.signoutRedirect()}
                  className="mt-6 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                  Log out
                </button>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>
    </>
  )
}
