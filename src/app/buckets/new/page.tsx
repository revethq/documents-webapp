'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import AppLayout from '@/components/app-layout'
import { Button } from '@/components/button'
import { Input } from '@/components/input'
import { Field, Label, Description } from '@/components/fieldset'
import { Heading, Subheading } from '@/components/heading'
import { Text } from '@/components/text'
import { Badge } from '@/components/badge'
import {
  CheckCircleIcon,
  CircleStackIcon,
  Cog6ToothIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon as CheckIconOutline,
} from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/solid'
import { usePostApiV1Buckets, getGetApiV1BucketsQueryKey } from '@/lib/api/generated/buckets/buckets'
import type { CreateBucketRequest } from '@/lib/api/models'
import { StorageProvider } from '@/lib/api/models'

const providerLabels: Record<string, string> = {
  S3: 'Amazon S3',
  GCS: 'Google Cloud Storage',
  AZURE_BLOB: 'Azure Blob Storage',
}

const providerDescriptions: Record<
  string,
  { accessKeyLabel: string; secretKeyLabel: string; helper: string }
> = {
  S3: {
    accessKeyLabel: 'Access Key ID',
    secretKeyLabel: 'Secret Access Key',
    helper: 'Standard S3 credentials for AWS IAM users.',
  },
  GCS: {
    accessKeyLabel: 'Access Key (HMAC)',
    secretKeyLabel: 'Secret Key (HMAC)',
    helper: 'HMAC keys generated in Google Cloud Storage settings.',
  },
  AZURE_BLOB: {
    accessKeyLabel: 'Storage Account Name',
    secretKeyLabel: 'Storage Account Key',
    helper: 'Use your Azure Storage account name and access key.',
  },
}

const AVAILABLE_PROVIDERS = [StorageProvider.S3, StorageProvider.GCS, StorageProvider.AZURE_BLOB]

interface BucketFormData {
  name: string
  provider: string
  bucketName: string
  accessKey: string
  secretKey: string
  region: string
  presignedUrlDurationMinutes: number
}

const initialFormData: BucketFormData = {
  name: '',
  provider: '',
  bucketName: '',
  accessKey: '',
  secretKey: '',
  region: '',
  presignedUrlDurationMinutes: 60,
}

type Step = 'basics' | 'details' | 'confirm'

const STEPS: { id: Step; name: string; icon: typeof CircleStackIcon }[] = [
  { id: 'basics', name: 'Basics', icon: CircleStackIcon },
  { id: 'details', name: 'Details', icon: Cog6ToothIcon },
  { id: 'confirm', name: 'Confirm', icon: CheckIconOutline },
]

export default function NewBucketPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const createMutation = usePostApiV1Buckets()

  const [formData, setFormData] = useState<BucketFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState<Step>('basics')
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState(false)

  const providerConfig = useMemo(() => {
    return providerDescriptions[formData.provider] || providerDescriptions.S3
  }, [formData.provider])

  const currentStepIndex = STEPS.findIndex((step) => step.id === currentStep)

  const canGoNext = () => {
    switch (currentStep) {
      case 'basics':
        return formData.name.trim().length > 0 && formData.provider.length > 0
      case 'details':
        return formData.bucketName.trim().length > 0 &&
          formData.accessKey.trim().length > 0 &&
          formData.secretKey.trim().length > 0
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
      const payload: CreateBucketRequest = {
        name: formData.name.trim(),
        provider: formData.provider as StorageProvider,
        bucketName: formData.bucketName.trim(),
        accessKey: formData.accessKey.trim(),
        secretKey: formData.secretKey.trim(),
        region: formData.region.trim() || null,
        presignedUrlDurationMinutes: formData.presignedUrlDurationMinutes,
      }

      const createdBucket = await createMutation.mutateAsync({ data: payload })
      await queryClient.invalidateQueries({ queryKey: getGetApiV1BucketsQueryKey() })
      setCreateSuccess(true)

      setTimeout(() => {
        router.push(`/buckets/${createdBucket.uuid}`)
      }, 1500)
    } catch (submitError) {
      console.error('Failed to create bucket:', submitError)
      setCreateError('Failed to create storage bucket. Please check your credentials and try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <Heading>Create Storage Bucket</Heading>
          <Text className="mt-2">Set up a new storage provider to store your documents.</Text>
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
            {currentStep === 'basics' && (
              <div>
                <Subheading>Name & Provider</Subheading>
                <Text className="mt-1">Choose a name and storage provider for this bucket.</Text>

                <div className="mt-6 space-y-6">
                  <Field>
                    <Label>Display name <span className="text-red-500">*</span></Label>
                    <Description>Visible to your team in the storage configuration list.</Description>
                    <Input
                      value={formData.name}
                      onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                      placeholder="Marketing Archive"
                    />
                  </Field>

                  <Field>
                    <Label>Storage Provider <span className="text-red-500">*</span></Label>
                    <Description>Choose the cloud storage provider for this bucket.</Description>
                    <div className="mt-3 space-y-3">
                      {AVAILABLE_PROVIDERS.map((provider) => (
                        <button
                          key={provider}
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              provider,
                              accessKey: '',
                              secretKey: '',
                            })
                          }
                          className={`flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-colors ${
                            formData.provider === provider
                              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                              : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:bg-zinc-800'
                          }`}
                        >
                          <CircleStackIcon
                            className={`size-8 ${
                              formData.provider === provider ? 'text-indigo-600' : 'text-zinc-400'
                            }`}
                          />
                          <div className="flex-1">
                            <p
                              className={`font-medium ${
                                formData.provider === provider
                                  ? 'text-indigo-900 dark:text-indigo-100'
                                  : 'text-zinc-900 dark:text-white'
                              }`}
                            >
                              {providerLabels[provider] || provider}
                            </p>
                            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                              {providerDescriptions[provider].helper}
                            </p>
                          </div>
                          {formData.provider === provider && (
                            <CheckCircleIcon className="size-6 text-indigo-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>
              </div>
            )}

            {currentStep === 'details' && (
              <div>
                <Subheading>Connection Details</Subheading>
                <Text className="mt-1">
                  Provider: <Badge color="indigo">{providerLabels[formData.provider] || formData.provider}</Badge>
                </Text>

                <div className="mt-6 space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field>
                      <Label>Bucket name <span className="text-red-500">*</span></Label>
                      <Description>Exact bucket name in the provider.</Description>
                      <Input
                        value={formData.bucketName}
                        onChange={(event) =>
                          setFormData({ ...formData, bucketName: event.target.value })
                        }
                        placeholder="my-bucket-name"
                      />
                    </Field>
                    <Field>
                      <Label>Region</Label>
                      <Description>Recommended for faster lookups.</Description>
                      <Input
                        value={formData.region}
                        onChange={(event) => setFormData({ ...formData, region: event.target.value })}
                        placeholder="us-east-1"
                      />
                    </Field>
                  </div>

                  <div className="border-t border-zinc-200 pt-6 dark:border-zinc-700">
                    <Field>
                      <Label>{providerConfig.accessKeyLabel} <span className="text-red-500">*</span></Label>
                      <Description>Use a key with read/write access to the bucket.</Description>
                      <Input
                        value={formData.accessKey}
                        onChange={(event) => setFormData({ ...formData, accessKey: event.target.value })}
                      />
                    </Field>
                  </div>

                  <Field>
                    <Label>{providerConfig.secretKeyLabel} <span className="text-red-500">*</span></Label>
                    <Description>Keep this secret secure.</Description>
                    <Input
                      type="password"
                      value={formData.secretKey}
                      onChange={(event) => setFormData({ ...formData, secretKey: event.target.value })}
                    />
                  </Field>
                </div>
              </div>
            )}

            {currentStep === 'confirm' && (
              <div>
                {createSuccess ? (
                  <div className="py-8 text-center">
                    <CheckCircleIcon className="mx-auto size-16 text-green-500" />
                    <p className="mt-4 text-lg font-medium text-green-700 dark:text-green-400">
                      Storage Bucket Created!
                    </p>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      Redirecting to bucket details...
                    </p>
                  </div>
                ) : (
                  <>
                    <Subheading>Review & Create</Subheading>
                    <Text className="mt-1">Please review your storage bucket configuration before creating.</Text>

                    <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
                      <dl className="divide-y divide-zinc-200 dark:divide-zinc-700">
                        <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                          <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Display Name</dt>
                          <dd className="mt-1 text-sm text-zinc-900 dark:text-white sm:col-span-2 sm:mt-0">
                            {formData.name}
                          </dd>
                        </div>
                        <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                          <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Provider</dt>
                          <dd className="mt-1 text-sm text-zinc-900 dark:text-white sm:col-span-2 sm:mt-0">
                            {providerLabels[formData.provider] || formData.provider}
                          </dd>
                        </div>
                        <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                          <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Bucket Name</dt>
                          <dd className="mt-1 text-sm text-zinc-900 dark:text-white sm:col-span-2 sm:mt-0">
                            {formData.bucketName}
                          </dd>
                        </div>
                        <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                          <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Region</dt>
                          <dd className="mt-1 text-sm text-zinc-900 dark:text-white sm:col-span-2 sm:mt-0">
                            {formData.region || <span className="italic text-zinc-400">Not specified</span>}
                          </dd>
                        </div>
                        <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                          <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Credentials</dt>
                          <dd className="mt-1 text-sm text-zinc-900 dark:text-white sm:col-span-2 sm:mt-0">
                            {formData.accessKey ? 'Configured' : 'Not configured'}
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
                        <CircleStackIcon className="size-5" />
                        {isSubmitting ? 'Creating Bucket...' : 'Create Bucket'}
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
              onClick={currentStepIndex === 0 ? () => router.push('/buckets') : goBack}
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
