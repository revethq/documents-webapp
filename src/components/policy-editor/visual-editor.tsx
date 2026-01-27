'use client'

import { PlusIcon } from '@heroicons/react/24/outline'
import { StatementCard } from './statement-card'
import type { StatementDto } from '@/lib/api/models'

interface VisualEditorProps {
  statements: StatementDto[]
  onChange: (statements: StatementDto[]) => void
  disabled?: boolean
}

const DEFAULT_STATEMENT: StatementDto = {
  sid: null,
  effect: 'Allow',
  actions: [],
  resources: ['*'],
  conditions: undefined,
}

export function VisualEditor({ statements, onChange, disabled }: VisualEditorProps) {
  const handleStatementChange = (index: number, statement: StatementDto) => {
    const newStatements = [...statements]
    newStatements[index] = statement
    onChange(newStatements)
  }

  const handleRemoveStatement = (index: number) => {
    const newStatements = statements.filter((_, i) => i !== index)
    onChange(newStatements)
  }

  const handleAddStatement = () => {
    onChange([...statements, { ...DEFAULT_STATEMENT }])
  }

  return (
    <div className="space-y-4">
      {statements.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center dark:border-gray-600">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No statements yet. Add a statement to define permissions.
          </p>
        </div>
      ) : (
        statements.map((statement, index) => (
          <StatementCard
            key={index}
            statement={statement}
            index={index}
            onChange={(s) => handleStatementChange(index, s)}
            onRemove={() => handleRemoveStatement(index)}
            disabled={disabled}
          />
        ))
      )}

      <button
        type="button"
        onClick={handleAddStatement}
        disabled={disabled}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-600 hover:border-indigo-500 hover:text-indigo-600 disabled:opacity-50 dark:border-gray-600 dark:text-gray-400 dark:hover:border-indigo-400 dark:hover:text-indigo-400"
      >
        <PlusIcon className="size-5" />
        Add Statement
      </button>
    </div>
  )
}
