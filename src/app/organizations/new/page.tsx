'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import AppLayout from "@/components/app-layout"
import { Button } from '@/components/button'
import { Input } from '@/components/input'
import { Textarea } from '@/components/textarea'
import { Select } from '@/components/select'
import { Field, Label, Description } from '@/components/fieldset'
import { Heading, Subheading } from '@/components/heading'
import { Text } from '@/components/text'
import {
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CheckIcon as CheckIconOutline,
} from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/24/solid'
import { usePostApiV1Organizations, getGetApiV1OrganizationsQueryKey } from "@/lib/api/generated/organizations/organizations"
import { useGetApiV1Buckets } from "@/lib/api/generated/buckets/buckets"
import type { BucketDTO } from "@/lib/api/models"

type Step = 'basic' | 'location' | 'confirm'

const STEPS: { id: Step; name: string; icon: typeof BuildingOfficeIcon }[] = [
  { id: 'basic', name: 'Basic Info', icon: BuildingOfficeIcon },
  { id: 'location', name: 'Contact', icon: MapPinIcon },
  { id: 'confirm', name: 'Confirm', icon: CheckIconOutline },
]

const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time' },
  { value: 'America/Chicago', label: 'Central Time' },
  { value: 'America/Denver', label: 'Mountain Time' },
  { value: 'America/Los_Angeles', label: 'Pacific Time' },
  { value: 'America/Anchorage', label: 'Alaska Time' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Shanghai', label: 'Shanghai' },
  { value: 'Asia/Kolkata', label: 'India' },
  { value: 'Australia/Sydney', label: 'Sydney' },
]

const LOCALES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ko', label: 'Korean' },
  { value: 'ar', label: 'Arabic' },
  { value: 'ru', label: 'Russian' },
  { value: 'nl', label: 'Dutch' },
]

const PROVIDER_LABELS: Record<string, string> = {
  S3: 'Amazon S3',
  GCS: 'Google Cloud Storage',
  AZURE_BLOB: 'Azure Blob Storage',
  MINIO: 'MinIO / S3-Compatible',
}

export default function NewOrganizationPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const createOrganization = usePostApiV1Organizations()

  // Fetch buckets
  const { data: bucketsResponse } = useGetApiV1Buckets()

  const buckets: BucketDTO[] = useMemo(() => {
    if (!bucketsResponse) return []
    if (Array.isArray(bucketsResponse)) return bucketsResponse
    if ('content' in bucketsResponse) return (bucketsResponse as { content: BucketDTO[] }).content
    return [bucketsResponse]
  }, [bucketsResponse])

  // Filter to only active buckets
  const activeBuckets = buckets.filter(b => b.isActive !== false)

  // Form state
  const [currentStep, setCurrentStep] = useState<Step>('basic')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    bucketId: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    phone: '',
    fax: '',
    website: '',
    timezone: 'America/Los_Angeles',
    locale: 'en',
  })

  // Get current step index
  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep)

  // Get selected bucket for display
  const selectedBucket = buckets.find(b => b.id?.toString() === formData.bucketId)

  // Navigation helpers
  const canGoNext = () => {
    switch (currentStep) {
      case 'basic':
        return formData.name.trim() !== '' && formData.bucketId !== ''
      case 'location':
        return true // Location/contact fields are optional
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // Create organization
  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.bucketId) return

    setIsCreating(true)
    setCreateError(null)

    try {
      await createOrganization.mutateAsync({
        data: {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          bucketId: parseInt(formData.bucketId, 10),
          address: formData.address.trim() || undefined,
          city: formData.city.trim() || undefined,
          state: formData.state.trim() || undefined,
          zipCode: formData.zipCode.trim() || undefined,
          country: formData.country.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          fax: formData.fax.trim() || undefined,
          website: formData.website.trim() || undefined,
          timezone: formData.timezone,
          locale: formData.locale,
        }
      })

      await queryClient.invalidateQueries({ queryKey: getGetApiV1OrganizationsQueryKey() })
      setCreateSuccess(true)

      // Redirect after a short delay
      setTimeout(() => {
        router.push('/organizations')
      }, 1500)
    } catch (error) {
      console.error('Failed to create organization:', error)
      setCreateError('Failed to create organization. Please try again.')
      setIsCreating(false)
    }
  }

  const getTimezoneLabel = (value: string) => TIMEZONES.find(t => t.value === value)?.label || value
  const getLocaleLabel = (value: string) => LOCALES.find(l => l.value === value)?.label || value

  return (
    <AppLayout>
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Heading>Create New Organization</Heading>
          <Text className="mt-2">Set up a new organization to manage projects and documents.</Text>
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
          {/* Basic Info Step */}
          {currentStep === 'basic' && (
            <div>
              <Subheading>Basic Information</Subheading>
              <Text className="mt-1">Enter the name and configure settings for your organization.</Text>

              <div className="mt-6 space-y-6">
                <Field>
                  <Label>Organization Name <span className="text-red-500">*</span></Label>
                  <Description>The official name of your organization.</Description>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Acme Corporation"
                    autoFocus
                  />
                </Field>

                <Field>
                  <Label>Description</Label>
                  <Description>A brief description of what your organization does.</Description>
                  <Textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="e.g., Leading provider of innovative solutions..."
                    rows={3}
                  />
                </Field>

                <Field>
                  <Label>Storage Bucket <span className="text-red-500">*</span></Label>
                  <Description>Select the storage bucket for document uploads.</Description>
                  {activeBuckets.length === 0 ? (
                    <div className="mt-2 rounded-lg border border-dashed border-zinc-300 p-4 text-center dark:border-zinc-600">
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">No storage buckets available.</p>
                      <Button className="mt-2" onClick={() => router.push('/buckets')}>
                        Configure a Bucket
                      </Button>
                    </div>
                  ) : (
                    <Select
                      name="bucketId"
                      value={formData.bucketId}
                      onChange={handleChange}
                    >
                      <option value="">Select a storage bucket</option>
                      {activeBuckets.map(bucket => (
                        <option key={bucket.id} value={bucket.id ?? ''}>
                          {bucket.name} ({PROVIDER_LABELS[bucket.provider] || bucket.provider})
                        </option>
                      ))}
                    </Select>
                  )}
                </Field>
              </div>
            </div>
          )}

          {/* Contact Step */}
          {currentStep === 'location' && (
            <div>
              <Subheading>Contact <span className="text-zinc-400 font-normal">(Optional)</span></Subheading>
              <Text className="mt-1">Add your organization&apos;s address, contact information, and regional settings.</Text>

              <div className="mt-6 space-y-6">
                <Field>
                  <Label>Street Address</Label>
                  <Input
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="e.g., 123 Main Street"
                  />
                </Field>

                <div className="grid grid-cols-6 gap-4">
                  <div className="col-span-3">
                    <Field>
                      <Label>City</Label>
                      <Input
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="e.g., San Francisco"
                      />
                    </Field>
                  </div>
                  <div className="col-span-2">
                    <Field>
                      <Label>State</Label>
                      <Input
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="e.g., CA"
                      />
                    </Field>
                  </div>
                  <div className="col-span-1">
                    <Field>
                      <Label>ZIP</Label>
                      <Input
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        placeholder="94102"
                      />
                    </Field>
                  </div>
                </div>

                <Field>
                  <Label>Country</Label>
                  <Input
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="e.g., US"
                  />
                </Field>

                <div className="border-t border-zinc-200 pt-6 dark:border-zinc-700">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Field>
                      <Label>Phone</Label>
                      <Input
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="(555) 123-4567"
                      />
                    </Field>
                    <Field>
                      <Label>Fax</Label>
                      <Input
                        name="fax"
                        type="tel"
                        value={formData.fax}
                        onChange={handleChange}
                        placeholder="(555) 123-4568"
                      />
                    </Field>
                    <Field>
                      <Label>Website</Label>
                      <Input
                        name="website"
                        type="url"
                        value={formData.website}
                        onChange={handleChange}
                        placeholder="https://example.com"
                      />
                    </Field>
                  </div>
                </div>

                <div className="border-t border-zinc-200 pt-6 dark:border-zinc-700">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field>
                      <Label>Timezone</Label>
                      <Select
                        name="timezone"
                        value={formData.timezone}
                        onChange={handleChange}
                      >
                        {TIMEZONES.map(tz => (
                          <option key={tz.value} value={tz.value}>{tz.label}</option>
                        ))}
                      </Select>
                    </Field>
                    <Field>
                      <Label>Locale</Label>
                      <Select
                        name="locale"
                        value={formData.locale}
                        onChange={handleChange}
                      >
                        {LOCALES.map(loc => (
                          <option key={loc.value} value={loc.value}>{loc.label}</option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                </div>
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
                    Organization Created!
                  </p>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Redirecting to organizations...
                  </p>
                </div>
              ) : (
                <>
                  <Subheading>Review & Create</Subheading>
                  <Text className="mt-1">Please review your organization details before creating.</Text>

                  <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
                    <dl className="divide-y divide-zinc-200 dark:divide-zinc-700">
                      {/* Basic Info */}
                      <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Name</dt>
                        <dd className="mt-1 text-sm text-zinc-900 dark:text-white sm:col-span-2 sm:mt-0">
                          {formData.name}
                        </dd>
                      </div>
                      <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Description</dt>
                        <dd className="mt-1 text-sm text-zinc-900 dark:text-white sm:col-span-2 sm:mt-0">
                          {formData.description || <span className="text-zinc-400 italic">No description</span>}
                        </dd>
                      </div>
                      <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Storage</dt>
                        <dd className="mt-1 text-sm text-zinc-900 dark:text-white sm:col-span-2 sm:mt-0">
                          {selectedBucket ? (
                            <>
                              {selectedBucket.name} ({PROVIDER_LABELS[selectedBucket.provider] || selectedBucket.provider})
                              {selectedBucket.region && <span className="text-zinc-500"> - {selectedBucket.region}</span>}
                            </>
                          ) : (
                            <span className="text-zinc-400 italic">No bucket selected</span>
                          )}
                        </dd>
                      </div>
                      <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Settings</dt>
                        <dd className="mt-1 text-sm text-zinc-900 dark:text-white sm:col-span-2 sm:mt-0">
                          <div>Timezone: {getTimezoneLabel(formData.timezone)}</div>
                          <div>Locale: {getLocaleLabel(formData.locale)}</div>
                        </dd>
                      </div>

                      {/* Location */}
                      {(formData.address || formData.city || formData.state || formData.zipCode || formData.country) && (
                        <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                          <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Address</dt>
                          <dd className="mt-1 text-sm text-zinc-900 dark:text-white sm:col-span-2 sm:mt-0">
                            {formData.address && <div>{formData.address}</div>}
                            {(formData.city || formData.state || formData.zipCode) && (
                              <div>
                                {formData.city}{formData.state && `, ${formData.state}`}{formData.zipCode && ` ${formData.zipCode}`}
                              </div>
                            )}
                            {formData.country && <div>{formData.country}</div>}
                          </dd>
                        </div>
                      )}

                      {/* Contact */}
                      {(formData.phone || formData.fax || formData.website) && (
                        <div className="px-4 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                          <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Contact</dt>
                          <dd className="mt-1 text-sm text-zinc-900 dark:text-white sm:col-span-2 sm:mt-0">
                            {formData.phone && <div>Phone: {formData.phone}</div>}
                            {formData.fax && <div>Fax: {formData.fax}</div>}
                            {formData.website && <div>Website: {formData.website}</div>}
                          </dd>
                        </div>
                      )}
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
                      <BuildingOfficeIcon className="size-5" />
                      {isCreating ? 'Creating Organization...' : 'Create Organization'}
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
