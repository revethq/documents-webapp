'use client'

import { useState, useMemo } from 'react'
import { Combobox, ComboboxInput, ComboboxOptions, ComboboxOption } from '@headlessui/react'
import { PlusIcon, XMarkIcon, ChevronUpDownIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { RESOURCE_TYPES, getResourceLabel, type ResourceType } from '@/lib/policy-resources'
import { useGetApiV1Documents } from '@/lib/api/generated/documents/documents'
import { useGetApiV1Organizations } from '@/lib/api/generated/organizations/organizations'
import { useGetApiV1Projects } from '@/lib/api/generated/projects/projects'
import { useGetApiV1Buckets } from '@/lib/api/generated/buckets/buckets'
import { useGetUsers } from '@/lib/api/generated/user-resource/user-resource'
import { useGetGroups } from '@/lib/api/generated/group-resource/group-resource'

interface ResourcePickerProps {
  selectedResources: string[]
  onChange: (resources: string[]) => void
  disabled?: boolean
}

interface ResourceOption {
  id: string
  label: string
  urn: string
}

export function ResourcePicker({ selectedResources, onChange, disabled }: ResourcePickerProps) {
  const [selectedType, setSelectedType] = useState<string>('')
  const [query, setQuery] = useState('')

  // Fetch all resource types (only when that type is selected)
  const { data: documentsData } = useGetApiV1Documents(undefined, {
    query: { enabled: selectedType === 'document' },
  })
  const { data: organizationsData } = useGetApiV1Organizations(undefined, {
    query: { enabled: selectedType === 'organization' },
  })
  const { data: projectsData } = useGetApiV1Projects(undefined, {
    query: { enabled: selectedType === 'project' },
  })
  const { data: bucketsData } = useGetApiV1Buckets(undefined, {
    query: { enabled: selectedType === 'bucket' },
  })
  const { data: usersData } = useGetUsers(undefined, {
    query: { enabled: selectedType === 'user' },
  })
  const { data: groupsData } = useGetGroups(undefined, {
    query: { enabled: selectedType === 'group' },
  })

  // Parse response data into options
  const resourceOptions = useMemo((): ResourceOption[] => {
    const resourceType = RESOURCE_TYPES.find(r => r.id === selectedType)
    if (!resourceType || selectedType === 'all') return []

    const parseResponse = <T extends { uuid?: string; id?: string; name?: string; displayName?: string; username?: string }>(
      data: unknown,
      urnPattern: string,
      labelFn: (item: T) => string
    ): ResourceOption[] => {
      if (!data) return []

      let items: T[] = []
      if (Array.isArray(data)) {
        items = data
      } else if (typeof data === 'object' && data !== null) {
        if ('content' in data) items = (data as { content: T[] }).content
        else if ('items' in data) items = (data as { items: T[] }).items
      }

      return items.map(item => {
        const id = item.uuid ?? item.id ?? ''
        return {
          id,
          label: labelFn(item),
          urn: urnPattern.replace('{id}', id),
        }
      })
    }

    switch (selectedType) {
      case 'document':
        return parseResponse(documentsData, resourceType.urnPattern, (d: { name?: string }) => d.name ?? 'Untitled')
      case 'organization':
        return parseResponse(organizationsData, resourceType.urnPattern, (o: { name?: string }) => o.name ?? 'Untitled')
      case 'project':
        return parseResponse(projectsData, resourceType.urnPattern, (p: { name?: string }) => p.name ?? 'Untitled')
      case 'bucket':
        return parseResponse(bucketsData, resourceType.urnPattern, (b: { name?: string }) => b.name ?? 'Untitled')
      case 'user':
        return parseResponse(usersData, resourceType.urnPattern, (u: { username?: string; email?: string }) => u.username ?? u.email ?? 'Unknown')
      case 'group':
        return parseResponse(groupsData, resourceType.urnPattern, (g: { displayName?: string }) => g.displayName ?? 'Unknown')
      default:
        return []
    }
  }, [selectedType, documentsData, organizationsData, projectsData, bucketsData, usersData, groupsData])

  // Filter options based on query
  const filteredOptions = useMemo(() => {
    if (!query) return resourceOptions
    const lowerQuery = query.toLowerCase()
    return resourceOptions.filter(
      opt => opt.label.toLowerCase().includes(lowerQuery) || opt.id.toLowerCase().includes(lowerQuery)
    )
  }, [resourceOptions, query])

  // Add wildcard option at the top
  const allOptions = useMemo(() => {
    const resourceType = RESOURCE_TYPES.find(r => r.id === selectedType)
    if (!resourceType || selectedType === 'all') return filteredOptions

    const wildcardOption: ResourceOption = {
      id: '*',
      label: `All ${resourceType.label}s`,
      urn: resourceType.urnPattern.replace('{id}', '*'),
    }

    return [wildcardOption, ...filteredOptions]
  }, [selectedType, filteredOptions])

  const handleAddAllResources = () => {
    if (!selectedResources.includes('*')) {
      onChange([...selectedResources, '*'])
    }
  }

  const handleSelect = (option: ResourceOption | null) => {
    if (!option) return

    if (!selectedResources.includes(option.urn)) {
      onChange([...selectedResources, option.urn])
    }

    setSelectedType('')
    setQuery('')
  }

  const handleRemove = (resource: string) => {
    onChange(selectedResources.filter(r => r !== resource))
  }

  const selectedResourceType = RESOURCE_TYPES.find(r => r.id === selectedType)
  const showResourceSelector = !!selectedType
  const hasAllResources = selectedResources.includes('*')

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1 sm:max-w-xs">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Resource Type
          </label>
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value)
              setQuery('')
            }}
            disabled={disabled}
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Select resource type...</option>
            {RESOURCE_TYPES.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {showResourceSelector && (
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Select {selectedResourceType?.label}
            </label>
            <Combobox value={null} onChange={handleSelect} disabled={disabled}>
              <div className="relative">
                <div className="relative">
                  <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                  <ComboboxInput
                    className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-10 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder={`Search ${selectedResourceType?.label.toLowerCase()}s...`}
                    onChange={(e) => setQuery(e.target.value)}
                    displayValue={() => query}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-2"
                  >
                    <ChevronUpDownIcon className="size-5 text-gray-400" />
                  </button>
                </div>

                <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none dark:bg-gray-800 dark:ring-white/10">
                  {allOptions.length === 0 ? (
                    <div className="px-4 py-2 text-gray-500 dark:text-gray-400">
                      No resources found
                    </div>
                  ) : (
                    allOptions.map((option) => (
                      <ComboboxOption
                        key={option.urn}
                        value={option}
                        className="group relative cursor-pointer select-none px-3 py-2 text-gray-900 data-[focus]:bg-indigo-600 data-[focus]:text-white dark:text-white"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{option.label}</span>
                          <span className="truncate text-xs font-mono text-gray-500 group-data-[focus]:text-indigo-200 dark:text-gray-400">
                            {option.urn}
                          </span>
                        </div>
                      </ComboboxOption>
                    ))
                  )}
                </ComboboxOptions>
              </div>
            </Combobox>
          </div>
        )}

        <button
          type="button"
          onClick={handleAddAllResources}
          disabled={disabled || hasAllResources}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
        >
          All Resources
        </button>
      </div>

      {selectedResources.length > 0 ? (
        <div className="space-y-1.5">
          {selectedResources.map((resource) => (
            <div
              key={resource}
              className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-700/50"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {getResourceLabel(resource)}
                </div>
                <div className="truncate text-xs font-mono text-gray-500 dark:text-gray-400">
                  {resource}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(resource)}
                disabled={disabled}
                className="ml-2 rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-red-600 dark:hover:bg-gray-600 dark:hover:text-red-400"
              >
                <XMarkIcon className="size-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No resources added. Add at least one resource.
        </p>
      )}
    </div>
  )
}
