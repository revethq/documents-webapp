'use client';

import { useState, Fragment } from 'react';
import { Combobox, ComboboxInput, ComboboxOptions, ComboboxOption } from '@headlessui/react';
import { XMarkIcon, PencilIcon, CheckIcon } from '@heroicons/react/20/solid';
import { Badge } from '@/components/badge';
import clsx from 'clsx';

export interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagSelectorProps {
  availableTags: Tag[];
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  onCreateTag?: (name: string) => Promise<Tag>;
  placeholder?: string;
  label?: string;
}

export function TagSelector({
  availableTags,
  selectedTags,
  onTagsChange,
  onCreateTag,
  placeholder = 'Select an option or create one',
  label = 'TAGS',
}: TagSelectorProps) {
  const [query, setQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const filteredTags =
    query === ''
      ? availableTags
      : availableTags.filter((tag) =>
          tag.name.toLowerCase().includes(query.toLowerCase())
        );

  const isExactMatch = filteredTags.some(
    (tag) => tag.name.toLowerCase() === query.toLowerCase()
  );

  const showCreateOption = query !== '' && !isExactMatch && onCreateTag;

  const handleToggleTag = (tag: Tag) => {
    const isSelected = selectedTags.some((t) => t.id === tag.id);
    if (isSelected) {
      onTagsChange(selectedTags.filter((t) => t.id !== tag.id));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleCreateTag = async () => {
    if (!onCreateTag || !query) return;

    setIsCreating(true);
    try {
      const newTag = await onCreateTag(query);
      onTagsChange([...selectedTags, newTag]);
      setQuery('');
    } catch (error) {
      console.error('Failed to create tag:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const isTagSelected = (tag: Tag) => selectedTags.some((t) => t.id === tag.id);

  return (
    <div className="space-y-2">
      {/* Label */}
      {label && (
        <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          {label}
        </div>
      )}

      {/* Selected tags display */}
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <div
            key={tag.id}
            className="group inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm"
            style={{
              backgroundColor: `#${tag.color}20`,
              color: `#${tag.color}`,
            }}
          >
            <span>{tag.name}</span>
            <button
              type="button"
              onClick={() => handleToggleTag(tag)}
              className="opacity-60 transition-opacity hover:opacity-100"
            >
              <XMarkIcon className="size-4" />
            </button>
          </div>
        ))}

        {/* Tag selector combobox */}
        <Combobox>
          {({ open }) => (
            <>
              <div className="relative">
                <ComboboxInput
                  className={clsx(
                    'rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm',
                    'placeholder:text-zinc-400',
                    'focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
                    'dark:border-zinc-700 dark:bg-zinc-900 dark:text-white'
                  )}
                  placeholder={placeholder}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />

                {open && (
                  <ComboboxOptions
                    className={clsx(
                      'absolute z-10 mt-1 max-h-60 w-64 overflow-auto rounded-md',
                      'bg-white shadow-lg ring-1 ring-black ring-opacity-5',
                      'dark:bg-zinc-800 dark:ring-white dark:ring-opacity-10',
                      'py-1 text-sm focus:outline-none'
                    )}
                  >
                    {filteredTags.length === 0 && query === '' && (
                      <div className="px-3 py-2 text-zinc-500">
                        No tags available
                      </div>
                    )}

                    {filteredTags.map((tag) => (
                      <ComboboxOption key={tag.id} value={tag} as={Fragment}>
                        {({ focus }) => (
                          <button
                            type="button"
                            onClick={() => handleToggleTag(tag)}
                            className={clsx(
                              'flex w-full cursor-pointer items-center gap-2 px-3 py-2',
                              focus && 'bg-zinc-100 dark:bg-zinc-700'
                            )}
                          >
                            <div
                              className={clsx(
                                'flex size-4 items-center justify-center rounded border',
                                isTagSelected(tag)
                                  ? 'border-blue-600 bg-blue-600'
                                  : 'border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900'
                              )}
                            >
                              {isTagSelected(tag) && (
                                <CheckIcon className="size-3 text-white" />
                              )}
                            </div>
                            <span
                              className="inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-xs"
                              style={{
                                backgroundColor: `#${tag.color}20`,
                                color: `#${tag.color}`,
                              }}
                            >
                              {tag.name}
                            </span>
                          </button>
                        )}
                      </ComboboxOption>
                    ))}

                    {showCreateOption && (
                      <button
                        type="button"
                        onClick={handleCreateTag}
                        disabled={isCreating}
                        className={clsx(
                          'flex w-full items-center gap-2 px-3 py-2 text-left',
                          'hover:bg-zinc-100 dark:hover:bg-zinc-700',
                          'text-blue-600 dark:text-blue-400',
                          isCreating && 'opacity-50'
                        )}
                      >
                        {isCreating ? (
                          <span>Creating...</span>
                        ) : (
                          <>
                            <span>Create &quot;{query}&quot;</span>
                          </>
                        )}
                      </button>
                    )}

                    {filteredTags.length === 0 && query !== '' && !showCreateOption && (
                      <div className="px-3 py-2 text-zinc-500">
                        No tags found
                      </div>
                    )}
                  </ComboboxOptions>
                )}
              </div>
            </>
          )}
        </Combobox>
      </div>
    </div>
  );
}
