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
import {
  UserGroupIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon as CheckIconOutline,
} from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/solid'
import { usePostGroups, getGetGroupsQueryKey } from '@/lib/api/generated/group-resource/group-resource'
import type { CreateGroupRequest } from '@/lib/api/models'

interface GroupFormData {
  displayName: string
}

const initialFormData: GroupFormData = {
  displayName: '',
}

type Step = 'details' | 'confirm'

const STEPS: { id: Step; name: string; icon: typeof UserGroupIcon }[] = [
  { id: 'details', name: 'Details', icon: UserGroupIcon },
  { id: 'confirm', name: 'Confirm', icon: CheckIconOutline },
]

export default function NewGroupPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const createMutation = usePostGroups()

  const [formData, setFormData] = useState<GroupFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState<Step>('details')
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState(false)

  const currentStepIndex = STEPS.findIndex((step) => step.id === currentStep)

  const canGoNext = () => {
    switch (currentStep) {
      case 'details':
        return formData.displayName.trim() !== ''
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
      const payload: CreateGroupRequest = {
        displayName: formData.displayName.trim(),
      }

      await createMutation.mutateAsync({ data: payload })
      await queryClient.invalidateQueries({ queryKey: getGetGroupsQueryKey() })
      setCreateSuccess(true)

      setTimeout(() => {
        router.push('/groups')
      }, 1500)
    } catch (submitError) {
      console.error('Failed to create group:', submitError)
      setCreateError('Failed to create group. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <Heading>Create New Group</Heading>
          <Text className="mt-2">Set up a new group in two steps.</Text>
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
          {currentStep === 'details' && (
            <div>
              <Subheading>Group Details</Subheading>
              <Text className="mt-1">Provide the name for the new group.</Text>

              <div className="mt-6">
                <FieldGroup>
                  <Field>
                    <Label>Display Name <span className="text-red-500">*</span></Label>
                    <Description>A descriptive name for this group.</Description>
                    <Input
                      value={formData.displayName}
                      onChange={(event) => setFormData({ ...formData, displayName: event.target.value })}
                      placeholder="Engineering Team"
                      required
                    />
                  </Field>
                </FieldGroup>
              </div>
            </div>
          )}

          {currentStep === 'confirm' && (
            <div>
              {createSuccess ? (
                <div className="py-8 text-center">
                  <CheckCircleIcon className="mx-auto size-16 text-green-500" />
                  <p className="mt-4 text-lg font-medium text-green-700 dark:text-green-400">
                    Group Created!
                  </p>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Redirecting to groups list...
                  </p>
                </div>
              ) : (
                <>
                  <Subheading>Review & Create</Subheading>
                  <Text className="mt-1">Please review the group details before creating.</Text>

                  <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
                    <dl className="divide-y divide-zinc-200 dark:divide-zinc-700">
                      <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Display Name</dt>
                        <dd className="mt-1 text-sm text-zinc-900 dark:text-white sm:col-span-2 sm:mt-0">
                          {formData.displayName}
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
                      <UserGroupIcon className="size-5" />
                      {isSubmitting ? 'Creating Group...' : 'Create Group'}
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
              onClick={currentStepIndex === 0 ? () => router.push('/groups') : goBack}
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
