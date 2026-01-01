'use client'

import { useState, useMemo } from 'react'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { CheckIcon, ChevronDownIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Input } from '@/components/input'
import { Button } from '@/components/button'
import type { TagDTO } from '@/lib/api/models'

interface TagPickerProps {
  /** All available tags */
  availableTags: TagDTO[]
  /** Currently selected tag slugs */
  selectedSlugs: string[]
  /** Callback when selection changes */
  onSelectionChange: (slugs: string[]) => void
  /** Optional callback to create a new tag - if provided, shows create UI */
  onCreateTag?: (name: string) => Promise<TagDTO>
  /** Placeholder text for the trigger button */
  placeholder?: string
  /** Label shown above the picker */
  label?: string
  /** Description text shown below the label */
  description?: string
  /** Optional list of suggested tag slugs to highlight (e.g., project tags) */
  suggestedSlugs?: string[]
  /** Label for suggested tags section */
  suggestedLabel?: string
  /** Display mode - 'popover' shows as dropdown, 'inline' shows all options inline */
  mode?: 'popover' | 'inline'
}

export function TagPicker({
  availableTags,
  selectedSlugs,
  onSelectionChange,
  onCreateTag,
  placeholder = 'Select tags...',
  label,
  description,
  suggestedSlugs = [],
  suggestedLabel = 'Suggested',
  mode = 'popover',
}: TagPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [newTagInput, setNewTagInput] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Filter tags by search query
  const filteredTags = useMemo(() => {
    if (!searchQuery) return availableTags
    const lowerQuery = searchQuery.toLowerCase()
    return availableTags.filter(tag =>
      tag.name.toLowerCase().includes(lowerQuery) ||
      tag.slug.toLowerCase().includes(lowerQuery)
    )
  }, [availableTags, searchQuery])

  // Separate suggested vs other tags
  const suggestedTags = useMemo(() => {
    return filteredTags.filter(tag => suggestedSlugs.includes(tag.slug))
  }, [filteredTags, suggestedSlugs])

  const otherTags = useMemo(() => {
    return filteredTags.filter(tag => !suggestedSlugs.includes(tag.slug))
  }, [filteredTags, suggestedSlugs])

  const toggleTag = (slug: string) => {
    if (selectedSlugs.includes(slug)) {
      onSelectionChange(selectedSlugs.filter(s => s !== slug))
    } else {
      onSelectionChange([...selectedSlugs, slug])
    }
  }

  const handleCreateTag = async () => {
    if (!onCreateTag || !newTagInput.trim() || isCreating) return

    setIsCreating(true)
    try {
      const newTag = await onCreateTag(newTagInput.trim())
      onSelectionChange([...selectedSlugs, newTag.slug])
      setNewTagInput('')
    } catch (error) {
      console.error('Failed to create tag:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const getTagBySlug = (slug: string) => availableTags.find(t => t.slug === slug)

  // Render a single tag button
  const renderTagButton = (tag: TagDTO) => {
    const isSelected = selectedSlugs.includes(tag.slug)
    return (
      <button
        key={tag.id ?? tag.slug}
        type="button"
        onClick={() => toggleTag(tag.slug)}
        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm transition-colors ${
          isSelected
            ? 'bg-blue-600 text-white'
            : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
        }`}
      >
        {isSelected && <CheckIcon className="size-3" />}
        {tag.name}
      </button>
    )
  }

  // Render selected tags with remove buttons
  const renderSelectedTags = () => {
    if (selectedSlugs.length === 0) return null

    return (
      <div className="flex flex-wrap gap-2">
        {selectedSlugs.map(slug => {
          const tag = getTagBySlug(slug)
          return (
            <span
              key={slug}
              className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-1 text-sm text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            >
              {tag?.name ?? slug}
              <button
                type="button"
                onClick={() => toggleTag(slug)}
                className="ml-0.5 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
              >
                <XMarkIcon className="size-4" />
              </button>
            </span>
          )
        })}
      </div>
    )
  }

  // Render create new tag UI
  const renderCreateTag = () => {
    if (!onCreateTag) return null

    return (
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
          Create New Tag
        </p>
        <div className="flex gap-2">
          <Input
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            placeholder="Enter new tag name"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleCreateTag()
              }
            }}
          />
          <Button
            type="button"
            onClick={handleCreateTag}
            disabled={!newTagInput.trim() || isCreating}
          >
            {isCreating ? (
              'Creating...'
            ) : (
              <>
                <PlusIcon className="size-4" />
                Add
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  // Inline mode - shows everything directly
  if (mode === 'inline') {
    return (
      <div className="space-y-3">
        {(label || description) && (
          <div>
            {label && <p className="text-sm font-medium text-zinc-900 dark:text-white">{label}</p>}
            {description && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>}
          </div>
        )}

        {/* Selected tags */}
        {renderSelectedTags()}

        {/* Search/filter input */}
        {availableTags.length > 5 && (
          <div>
            <input
              type="text"
              placeholder="Filter tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-white"
            />
          </div>
        )}

        {/* Suggested tags */}
        {suggestedTags.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              {suggestedLabel}
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedTags.map(renderTagButton)}
            </div>
          </div>
        )}

        {/* Other tags */}
        {otherTags.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
              All Tags
            </p>
            <div className="flex flex-wrap gap-2">
              {otherTags.map(renderTagButton)}
            </div>
          </div>
        )}

        {/* Empty state */}
        {availableTags.length === 0 && !onCreateTag && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No tags available</p>
        )}

        {/* No results from filter */}
        {searchQuery && filteredTags.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No tags match &quot;{searchQuery}&quot;</p>
        )}

        {/* Create new tag */}
        {renderCreateTag()}
      </div>
    )
  }

  // Popover mode - shows as dropdown
  return (
    <div>
      {label && (
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {label} {selectedSlugs.length > 0 && `(${selectedSlugs.length})`}
        </label>
      )}
      <Popover className="relative">
        <PopoverButton className="flex w-full items-center justify-between rounded-lg border border-zinc-300 bg-white px-3 py-2 text-left text-sm dark:border-zinc-600 dark:bg-zinc-800">
          <span className="text-zinc-500 dark:text-zinc-400">
            {selectedSlugs.length === 0
              ? placeholder
              : `${selectedSlugs.length} tag${selectedSlugs.length > 1 ? 's' : ''} selected`}
          </span>
          <ChevronDownIcon className="size-4 text-zinc-400" />
        </PopoverButton>
        <PopoverPanel className="absolute z-10 mt-1 w-72 rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
          {/* Search input */}
          <div className="border-b border-zinc-200 p-2 dark:border-zinc-700">
            <input
              type="text"
              placeholder="Search tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-white"
            />
          </div>

          {/* Tag list */}
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredTags.length === 0 ? (
              <div className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">
                {searchQuery ? 'No tags found' : 'No tags available'}
              </div>
            ) : (
              filteredTags.map(tag => {
                const isSelected = selectedSlugs.includes(tag.slug)
                return (
                  <button
                    key={tag.id ?? tag.slug}
                    type="button"
                    onClick={() => toggleTag(tag.slug)}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  >
                    <div className={`flex size-4 items-center justify-center rounded border ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900'
                    }`}>
                      {isSelected && <CheckIcon className="size-3 text-white" />}
                    </div>
                    <span className="text-zinc-900 dark:text-zinc-100">{tag.name}</span>
                  </button>
                )
              })
            )}
          </div>

          {/* Selected tags summary */}
          {selectedSlugs.length > 0 && (
            <div className="border-t border-zinc-200 p-2 dark:border-zinc-700">
              <div className="flex flex-wrap gap-1">
                {selectedSlugs.map(slug => {
                  const tag = getTagBySlug(slug)
                  return (
                    <span
                      key={slug}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    >
                      {tag?.name ?? slug}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleTag(slug)
                        }}
                        className="hover:text-blue-900 dark:hover:text-blue-200"
                      >
                        <XMarkIcon className="size-3" />
                      </button>
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* Create new tag option in popover */}
          {onCreateTag && (
            <div className="border-t border-zinc-200 p-2 dark:border-zinc-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New tag name..."
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleCreateTag()
                    }
                  }}
                  className="flex-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleCreateTag}
                  disabled={!newTagInput.trim() || isCreating}
                  className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <PlusIcon className="size-4" />
                  {isCreating ? '...' : 'Add'}
                </button>
              </div>
            </div>
          )}
        </PopoverPanel>
      </Popover>
    </div>
  )
}
