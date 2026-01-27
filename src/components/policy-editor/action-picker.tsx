'use client'

import { useState, useMemo } from 'react'
import { Combobox, ComboboxInput, ComboboxOptions, ComboboxOption } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { ACTION_CATEGORIES, getActionLabel, type ActionDefinition } from '@/lib/policy-actions'

interface ActionPickerProps {
  selectedActions: string[]
  onChange: (actions: string[]) => void
  disabled?: boolean
}

export function ActionPicker({ selectedActions, onChange, disabled }: ActionPickerProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const filteredCategories = useMemo(() => {
    if (!query) return ACTION_CATEGORIES

    const lowerQuery = query.toLowerCase()
    return ACTION_CATEGORIES.map(category => ({
      ...category,
      actions: category.actions.filter(
        action =>
          action.label.toLowerCase().includes(lowerQuery) ||
          action.action.toLowerCase().includes(lowerQuery) ||
          action.description.toLowerCase().includes(lowerQuery)
      ),
    })).filter(category => category.actions.length > 0)
  }, [query])

  const handleSelect = (action: ActionDefinition | null) => {
    if (!action) return
    if (selectedActions.includes(action.action)) {
      onChange(selectedActions.filter(a => a !== action.action))
    } else {
      onChange([...selectedActions, action.action])
    }
    setQuery('')
  }

  const handleRemove = (action: string) => {
    onChange(selectedActions.filter(a => a !== action))
  }

  return (
    <div className="space-y-2">
      <Combobox
        value={null}
        onChange={handleSelect}
        disabled={disabled}
      >
        <div className="relative">
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <ComboboxInput
              className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-10 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="Search actions..."
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsOpen(true)}
              displayValue={() => query}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-2"
              onClick={() => setIsOpen(!isOpen)}
            >
              <ChevronUpDownIcon className="size-5 text-gray-400" />
            </button>
          </div>

          <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none dark:bg-gray-800 dark:ring-white/10">
            {filteredCategories.length === 0 ? (
              <div className="px-4 py-2 text-gray-500 dark:text-gray-400">
                No actions found
              </div>
            ) : (
              filteredCategories.map(category => (
                <div key={category.name}>
                  <div className="sticky top-0 bg-gray-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                    {category.name}
                  </div>
                  {category.actions.map(action => (
                    <ComboboxOption
                      key={action.action}
                      value={action}
                      className="group relative cursor-pointer select-none px-3 py-2 text-gray-900 data-[focus]:bg-indigo-600 data-[focus]:text-white dark:text-white"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-medium">{action.label}</span>
                            {selectedActions.includes(action.action) && (
                              <CheckIcon className="size-4 text-indigo-600 group-data-[focus]:text-white" />
                            )}
                          </div>
                          <div className="truncate text-xs text-gray-500 group-data-[focus]:text-indigo-200 dark:text-gray-400">
                            {action.action}
                          </div>
                        </div>
                      </div>
                    </ComboboxOption>
                  ))}
                </div>
              ))
            )}
          </ComboboxOptions>
        </div>
      </Combobox>

      {selectedActions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedActions.map(action => (
            <span
              key={action}
              className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
            >
              {getActionLabel(action)}
              <button
                type="button"
                onClick={() => handleRemove(action)}
                disabled={disabled}
                className="hover:text-indigo-900 dark:hover:text-indigo-200"
              >
                <XMarkIcon className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
