'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import AppLayout from "@/components/app-layout"
import { Button } from '@/components/button'
import { Input } from '@/components/input'
import { Textarea } from '@/components/textarea'
import { Field, Label, Description } from '@/components/fieldset'
import { Heading, Subheading } from '@/components/heading'
import { Text } from '@/components/text'
import { Badge } from '@/components/badge'
import {
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  BuildingOfficeIcon,
  FolderIcon,
  DocumentTextIcon,
  CheckIcon as CheckIconOutline,
} from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/solid'
import { usePostApiV1Projects, getGetApiV1ProjectsQueryKey } from "@/lib/api/generated/projects/projects"
import { useGetApiV1Organizations } from "@/lib/api/generated/organizations/organizations"
import type { OrganizationDTO } from "@/lib/api/models/organizationDTO"

type Step = 'organization' | 'details' | 'confirm'

const STEPS: { id: Step; name: string; icon: typeof BuildingOfficeIcon }[] = [
  { id: 'organization', name: 'Organization', icon: BuildingOfficeIcon },
  { id: 'details', name: 'Details', icon: DocumentTextIcon },
  { id: 'confirm', name: 'Confirm', icon: CheckIconOutline },
]

export default function NewProjectPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const createProject = usePostApiV1Projects()

  // Form state
  const [currentStep, setCurrentStep] = useState<Step>('organization')
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null)
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState(false)

  // API queries
  const { data: organizationsResponse } = useGetApiV1Organizations()

  // Parse responses
  const organizations: OrganizationDTO[] = useMemo(() => {
    if (!organizationsResponse) return []
    if (Array.isArray(organizationsResponse)) return organizationsResponse
    if ('content' in organizationsResponse) return (organizationsResponse as { content: OrganizationDTO[] }).content
    return [organizationsResponse]
  }, [organizationsResponse])

  const selectedOrg = organizations.find(o => o.id === selectedOrgId)

  // Get current step index
  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep)

  // Navigation helpers
  const canGoNext = () => {
    switch (currentStep) {
      case 'organization':
        return selectedOrgId !== null
      case 'details':
        return projectName.trim() !== ''
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

  // Create project
  const handleCreate = async () => {
    if (!selectedOrgId || !projectName.trim()) return

    setIsCreating(true)
    setCreateError(null)

    try {
      await createProject.mutateAsync({
        data: {
          name: projectName.trim(),
          description: projectDescription.trim() || undefined,
          organizationId: selectedOrgId,
          clientIds: [],
          tags: [],
        }
      })

      await queryClient.invalidateQueries({ queryKey: getGetApiV1ProjectsQueryKey() })
      setCreateSuccess(true)

      // Redirect after a short delay
      setTimeout(() => {
        router.push('/projects')
      }, 1500)
    } catch (error) {
      console.error('Failed to create project:', error)
      setCreateError('Failed to create project. Please try again.')
      setIsCreating(false)
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Heading>Create New Project</Heading>
          <Text className="mt-2">Set up a new project to organize your documents.</Text>
        </div>

        {/* Step indicator */}
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
                      <div className={`ml-2 h-0.5 flex-1 ${isComplete ? 'bg-indigo-600' : 'bg-zinc-200 dark:bg-zinc-700'}`} />
                    )}
                  </div>
                  <span className={`absolute -bottom-6 left-0 w-max text-xs font-medium ${
                    isCurrent ? 'text-indigo-600' : 'text-zinc-500 dark:text-zinc-400'
                  }`}>
                    {step.name}
                  </span>
                </li>
              )
            })}
          </ol>
        </nav>

        {/* Content area */}
        <div className="mt-12 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-800/50">
          {/* Organization Step */}
          {currentStep === 'organization' && (
            <div>
              <Subheading>Select Organization</Subheading>
              <Text className="mt-1">Choose the organization this project belongs to.</Text>

              <div className="mt-6 space-y-3">
                {organizations.map(org => (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => setSelectedOrgId(org.id ?? null)}
                    className={`flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-colors ${
                      selectedOrgId === org.id
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <BuildingOfficeIcon className={`size-8 ${selectedOrgId === org.id ? 'text-indigo-600' : 'text-zinc-400'}`} />
                    <div className="flex-1">
                      <p className={`font-medium ${selectedOrgId === org.id ? 'text-indigo-900 dark:text-indigo-100' : 'text-zinc-900 dark:text-white'}`}>
                        {org.name}
                      </p>
                      {org.description && (
                        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{org.description}</p>
                      )}
                    </div>
                    {selectedOrgId === org.id && (
                      <CheckCircleIcon className="size-6 text-indigo-600" />
                    )}
                  </button>
                ))}

                {organizations.length === 0 && (
                  <div className="rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-600">
                    <BuildingOfficeIcon className="mx-auto size-12 text-zinc-400" />
                    <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">No organizations available</p>
                    <Button className="mt-4" onClick={() => router.push('/organizations/new')}>
                      Create Organization
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Details Step */}
          {currentStep === 'details' && (
            <div>
              <Subheading>Project Details</Subheading>
              <Text className="mt-1">
                Creating project in <Badge color="indigo">{selectedOrg?.name}</Badge>
              </Text>

              <div className="mt-6 space-y-6">
                <Field>
                  <Label>Project Name <span className="text-red-500">*</span></Label>
                  <Description>Choose a descriptive name for your project.</Description>
                  <Input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g., Q4 Marketing Campaign"
                    autoFocus
                  />
                </Field>

                <Field>
                  <Label>Description</Label>
                  <Description>Briefly describe what this project is for.</Description>
                  <Textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="e.g., All marketing materials and assets for Q4 2024"
                    rows={3}
                  />
                </Field>
              </div>
            </div>
          )}

          {/* Confirm Step */}
          {currentStep === 'confirm' && (
            <div>
              {createSuccess ? (
                <div className="text-center py-8">
                  <CheckCircleIcon className="mx-auto size-16 text-green-500" />
                  <p className="mt-4 text-lg font-medium text-green-700 dark:text-green-400">
                    Project Created!
                  </p>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Redirecting to projects...
                  </p>
                </div>
              ) : (
                <>
                  <Subheading>Review & Create</Subheading>
                  <Text className="mt-1">Please review your project details before creating.</Text>

                  <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
                    <dl className="divide-y divide-zinc-200 dark:divide-zinc-700">
                      <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Organization</dt>
                        <dd className="mt-1 text-sm text-zinc-900 dark:text-white sm:col-span-2 sm:mt-0">
                          {selectedOrg?.name}
                        </dd>
                      </div>
                      <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Project Name</dt>
                        <dd className="mt-1 text-sm text-zinc-900 dark:text-white sm:col-span-2 sm:mt-0">
                          {projectName}
                        </dd>
                      </div>
                      <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Description</dt>
                        <dd className="mt-1 text-sm text-zinc-900 dark:text-white sm:col-span-2 sm:mt-0">
                          {projectDescription || <span className="text-zinc-400 italic">No description</span>}
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
                      onClick={handleCreate}
                      disabled={isCreating}
                      className="w-full"
                    >
                      <FolderIcon className="size-5" />
                      {isCreating ? 'Creating Project...' : 'Create Project'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        {!createSuccess && (
          <div className="mt-6 flex justify-between">
            <Button
              outline
              onClick={goBack}
              disabled={currentStepIndex === 0}
              className={currentStepIndex === 0 ? 'invisible' : ''}
            >
              <ArrowLeftIcon className="size-4" />
              Back
            </Button>

            {currentStep !== 'confirm' && (
              <Button
                onClick={goNext}
                disabled={!canGoNext()}
              >
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
