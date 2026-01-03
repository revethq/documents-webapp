'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import AppLayout from '@/components/app-layout'
import { Button } from '@/components/button'
import { Input } from '@/components/input'
import { Field, FieldGroup, Label, Description } from '@/components/fieldset'
import { Heading, Subheading } from '@/components/heading'
import { Text } from '@/components/text'
import { Divider } from '@/components/divider'
import {
  UserCircleIcon,
  IdentificationIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  UserPlusIcon,
  CheckIcon as CheckIconOutline,
} from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/solid'
import { usePostApiV1Users, getGetApiV1UsersQueryKey } from '@/lib/api/generated/users/users'
import type { CreateUserRequest } from '@/lib/api/models'

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
}

type Step = 'account' | 'details' | 'confirm'

const STEPS: { id: Step; name: string; icon: typeof UserCircleIcon }[] = [
  { id: 'account', name: 'Account', icon: UserCircleIcon },
  { id: 'details', name: 'Details', icon: IdentificationIcon },
  { id: 'confirm', name: 'Confirm', icon: CheckIconOutline },
]

export default function NewUserPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const createMutation = usePostApiV1Users()

  const [formData, setFormData] = useState<UserFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState<Step>('account')
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState(false)

  const currentStepIndex = STEPS.findIndex((step) => step.id === currentStep)

  const canGoNext = () => {
    switch (currentStep) {
      case 'account':
        return formData.username.trim() !== '' && formData.email.trim() !== ''
      case 'details':
        return true
      case 'confirm':
        return false
      default:
        return false
    }
  }

  const goNext = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id)
    }
  }

  const goBack = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setCreateError(null)

    try {
      const payload: CreateUserRequest = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        firstName: formData.firstName.trim() || null,
        lastName: formData.lastName.trim() || null,
        title: formData.title.trim() || null,
        timezone: formData.timezone.trim() || null,
        phoneOffice: formData.phoneOffice.trim() || null,
        phoneMobile: formData.phoneMobile.trim() || null,
        phoneFax: formData.phoneFax.trim() || null,
        phoneExt: formData.phoneExt.trim() || null,
        accessNewProjects: formData.accessNewProjects,
      }

      const createdUser = await createMutation.mutateAsync({ data: payload })
      await queryClient.invalidateQueries({ queryKey: getGetApiV1UsersQueryKey() })
      setCreateSuccess(true)

      setTimeout(() => {
        router.push(`/users/${createdUser.uuid}`)
      }, 1500)
    } catch (submitError) {
      console.error('Failed to create user:', submitError)
      setCreateError('Failed to create user. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <Heading>Create New User</Heading>
          <Text className="mt-2">Set up a new user account in three steps.</Text>
        </div>

        <nav aria-label="Progress" className="mb-8">
          <ol className="flex items-center">
            {STEPS.map((step, index) => {
              const isComplete = index < currentStepIndex || createSuccess
              const isCurrent = step.id === currentStep && !createSuccess

              return (
                <li key={step.id} className={`relative ${index !== STEPS.length - 1 ? 'flex-1' : ''}`}>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => index < currentStepIndex && !createSuccess && setCurrentStep(step.id)}
                      disabled={index > currentStepIndex || createSuccess}
                      className={`relative flex size-10 items-center justify-center rounded-full transition-colors ${
                        isComplete
                          ? 'bg-indigo-600 hover:bg-indigo-700'
                          : isCurrent
                          ? 'border-2 border-indigo-600 bg-white dark:bg-zinc-900'
                          : 'border-2 border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900'
                      }`}
                    >
                      {isComplete ? (
                        <CheckIcon className="size-5 text-white" />
                      ) : (
                        <step.icon className={`size-5 ${isCurrent ? 'text-indigo-600' : 'text-zinc-400'}`} />
                      )}
                    </button>
                    {index !== STEPS.length - 1 && (
                      <div
                        className={`ml-2 h-0.5 flex-1 ${
                          isComplete ? 'bg-indigo-600' : 'bg-zinc-200 dark:bg-zinc-700'
                        }`}
                      />
                    )}
                  </div>
                  <span
                    className={`absolute -bottom-6 left-0 w-max text-xs font-medium ${
                      isCurrent ? 'text-indigo-600' : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    {step.name}
                  </span>
                </li>
              )
            })}
          </ol>
        </nav>

        <div className="mt-12 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800/50">
          {currentStep === 'account' && (
            <div>
              <Subheading>Account Basics</Subheading>
              <Text className="mt-1">Provide the username and email for the new user.</Text>

              <div className="mt-6">
                <FieldGroup>
                  <Field>
                    <Label>Username <span className="text-red-500">*</span></Label>
                    <Description>Used for sign-in and internal references.</Description>
                    <Input
                      value={formData.username}
                      onChange={(event) => setFormData({ ...formData, username: event.target.value })}
                      placeholder="jane.doe"
                      required
                    />
                  </Field>
                  <Field>
                    <Label>Email <span className="text-red-500">*</span></Label>
                    <Description>Primary email address for this user.</Description>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                      placeholder="jane@example.com"
                      required
                    />
                  </Field>
                </FieldGroup>
              </div>
            </div>
          )}

          {currentStep === 'details' && (
            <div>
              <Subheading>User Details</Subheading>
              <Text className="mt-1">Add optional profile and contact information.</Text>

              <div className="mt-6 space-y-8">
                {/* Profile Section */}
                <div>
                  <h3 className="text-sm font-medium text-zinc-900 dark:text-white">Profile</h3>
                  <div className="mt-4">
                    <FieldGroup>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <Field>
                          <Label>First name</Label>
                          <Input
                            value={formData.firstName}
                            onChange={(event) => setFormData({ ...formData, firstName: event.target.value })}
                          />
                        </Field>
                        <Field>
                          <Label>Last name</Label>
                          <Input
                            value={formData.lastName}
                            onChange={(event) => setFormData({ ...formData, lastName: event.target.value })}
                          />
                        </Field>
                      </div>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <Field>
                          <Label>Title</Label>
                          <Input
                            value={formData.title}
                            onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                          />
                        </Field>
                        <Field>
                          <Label>Timezone</Label>
                          <Input
                            value={formData.timezone}
                            onChange={(event) => setFormData({ ...formData, timezone: event.target.value })}
                            placeholder="America/New_York"
                          />
                        </Field>
                      </div>
                    </FieldGroup>
                  </div>
                </div>

                <Divider />

                {/* Contact Section */}
                <div>
                  <h3 className="text-sm font-medium text-zinc-900 dark:text-white">Contact</h3>
                  <div className="mt-4">
                    <FieldGroup>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <Field>
                          <Label>Office phone</Label>
                          <Input
                            value={formData.phoneOffice}
                            onChange={(event) => setFormData({ ...formData, phoneOffice: event.target.value })}
                          />
                        </Field>
                        <Field>
                          <Label>Mobile phone</Label>
                          <Input
                            value={formData.phoneMobile}
                            onChange={(event) => setFormData({ ...formData, phoneMobile: event.target.value })}
                          />
                        </Field>
                      </div>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <Field>
                          <Label>Fax</Label>
                          <Input
                            value={formData.phoneFax}
                            onChange={(event) => setFormData({ ...formData, phoneFax: event.target.value })}
                          />
                        </Field>
                        <Field>
                          <Label>Extension</Label>
                          <Input
                            value={formData.phoneExt}
                            onChange={(event) => setFormData({ ...formData, phoneExt: event.target.value })}
                          />
                        </Field>
                      </div>
                    </FieldGroup>
                  </div>
                </div>

                <Divider />

                {/* Permissions Section */}
                <div>
                  <h3 className="text-sm font-medium text-zinc-900 dark:text-white">Permissions</h3>
                  <div className="mt-4">
                    <Field>
                      <Label>Project access</Label>
                      <Description>Allow access to new projects by default.</Description>
                      <label className="inline-flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-200">
                        <input
                          type="checkbox"
                          checked={formData.accessNewProjects}
                          onChange={(event) =>
                            setFormData({ ...formData, accessNewProjects: event.target.checked })
                          }
                          className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 dark:border-zinc-600 dark:bg-zinc-700"
                        />
                        Enable by default
                      </label>
                    </Field>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 'confirm' && (
            <div>
              {createSuccess ? (
                <div className="py-8 text-center">
                  <CheckCircleIcon className="mx-auto size-16 text-green-500" />
                  <p className="mt-4 text-lg font-medium text-green-700 dark:text-green-400">
                    User Created!
                  </p>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Redirecting to user profile...
                  </p>
                </div>
              ) : (
                <>
                  <Subheading>Review & Create</Subheading>
                  <Text className="mt-1">Please review the user details before creating.</Text>

                  <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
                    <dl className="divide-y divide-zinc-200 dark:divide-zinc-700">
                      <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Username</dt>
                        <dd className="mt-1 text-sm text-zinc-900 dark:text-white sm:col-span-2 sm:mt-0">
                          {formData.username}
                        </dd>
                      </div>
                      <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Email</dt>
                        <dd className="mt-1 text-sm text-zinc-900 dark:text-white sm:col-span-2 sm:mt-0">
                          {formData.email}
                        </dd>
                      </div>
                      <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Name</dt>
                        <dd className="mt-1 text-sm text-zinc-900 dark:text-white sm:col-span-2 sm:mt-0">
                          {`${formData.firstName} ${formData.lastName}`.trim() || <span className="italic text-zinc-400">Not provided</span>}
                        </dd>
                      </div>
                      <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Title</dt>
                        <dd className="mt-1 text-sm text-zinc-900 dark:text-white sm:col-span-2 sm:mt-0">
                          {formData.title || <span className="italic text-zinc-400">Not provided</span>}
                        </dd>
                      </div>
                      <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Timezone</dt>
                        <dd className="mt-1 text-sm text-zinc-900 dark:text-white sm:col-span-2 sm:mt-0">
                          {formData.timezone || <span className="italic text-zinc-400">Not provided</span>}
                        </dd>
                      </div>
                      <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Contact</dt>
                        <dd className="mt-1 text-sm text-zinc-900 dark:text-white sm:col-span-2 sm:mt-0">
                          {formData.phoneOffice || formData.phoneMobile ? (
                            <span>
                              {formData.phoneOffice && <span>Office: {formData.phoneOffice}</span>}
                              {formData.phoneOffice && formData.phoneMobile && <span> · </span>}
                              {formData.phoneMobile && <span>Mobile: {formData.phoneMobile}</span>}
                            </span>
                          ) : (
                            <span className="italic text-zinc-400">Not provided</span>
                          )}
                        </dd>
                      </div>
                      <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Project access</dt>
                        <dd className="mt-1 text-sm text-zinc-900 dark:text-white sm:col-span-2 sm:mt-0">
                          {formData.accessNewProjects ? 'Enabled by default' : 'Disabled'}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {createError && (
                    <div className="mt-4 rounded-md bg-red-50 p-4 dark:bg-red-900/10">
                      <p className="text-sm text-red-800 dark:text-red-400">{createError}</p>
                    </div>
                  )}

                  <div className="mt-6">
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="w-full"
                    >
                      <UserPlusIcon className="size-5" />
                      {isSubmitting ? 'Creating User...' : 'Create User'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {!createSuccess && (
          <div className="mt-6 flex justify-between">
            <Button
              outline
              onClick={currentStepIndex === 0 ? () => router.push('/users') : goBack}
            >
              <ArrowLeftIcon className="size-4" />
              {currentStepIndex === 0 ? 'Cancel' : 'Back'}
            </Button>

            {currentStep !== 'confirm' && (
              <Button onClick={goNext} disabled={!canGoNext()}>
                Next
                <ArrowRightIcon className="size-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
