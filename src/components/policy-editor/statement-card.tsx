'use client'

import { TrashIcon } from '@heroicons/react/24/outline'
import { ActionPicker } from './action-picker'
import { ResourcePicker } from './resource-picker'
import type { StatementDto } from '@/lib/api/models'

interface StatementCardProps {
  statement: StatementDto
  index: number
  onChange: (statement: StatementDto) => void
  onRemove: () => void
  disabled?: boolean
}

export function StatementCard({ statement, index, onChange, onRemove, disabled }: StatementCardProps) {
  const handleEffectChange = (effect: string) => {
    onChange({ ...statement, effect })
  }

  const handleActionsChange = (actions: string[]) => {
    onChange({ ...statement, actions })
  }

  const handleResourcesChange = (resources: string[]) => {
    onChange({ ...statement, resources })
  }

  const handleSidChange = (sid: string) => {
    onChange({ ...statement, sid: sid || null })
  }

  const hasConditions = statement.conditions && Object.keys(statement.conditions).length > 0

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          Statement {index + 1}
        </h4>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-700 dark:hover:text-red-400"
        >
          <TrashIcon className="size-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Statement ID (optional)
            </label>
            <input
              type="text"
              value={statement.sid ?? ''}
              onChange={(e) => handleSidChange(e.target.value)}
              disabled={disabled}
              placeholder="e.g., AllowReadDocuments"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Effect
            </label>
            <div className="mt-1 flex gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name={`effect-${index}`}
                  value="Allow"
                  checked={statement.effect === 'Allow'}
                  onChange={(e) => handleEffectChange(e.target.value)}
                  disabled={disabled}
                  className="size-4 border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Allow</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name={`effect-${index}`}
                  value="Deny"
                  checked={statement.effect === 'Deny'}
                  onChange={(e) => handleEffectChange(e.target.value)}
                  disabled={disabled}
                  className="size-4 border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Deny</span>
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Actions
          </label>
          <div className="mt-1">
            <ActionPicker
              selectedActions={statement.actions}
              onChange={handleActionsChange}
              disabled={disabled}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Resources
          </label>
          <ResourcePicker
            selectedResources={statement.resources}
            onChange={handleResourcesChange}
            disabled={disabled}
          />
        </div>

        {hasConditions && (
          <div className="rounded-md bg-amber-50 p-3 dark:bg-amber-900/20">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              This statement has conditions that can only be edited in JSON mode.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
