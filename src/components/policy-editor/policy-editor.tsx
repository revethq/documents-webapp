'use client'

import { useState } from 'react'
import { VisualEditor } from './visual-editor'
import { JsonEditor } from './json-editor'
import type { StatementDto } from '@/lib/api/models'

type EditorMode = 'visual' | 'json'

interface PolicyEditorProps {
  statements: StatementDto[]
  onChange: (statements: StatementDto[]) => void
  disabled?: boolean
}

export function PolicyEditor({ statements, onChange, disabled }: PolicyEditorProps) {
  const [mode, setMode] = useState<EditorMode>('visual')
  const [jsonError, setJsonError] = useState<string | null>(null)

  const handleModeChange = (newMode: EditorMode) => {
    if (newMode === mode) return

    if (mode === 'json' && jsonError) {
      return
    }

    setMode(newMode)
  }

  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            type="button"
            onClick={() => handleModeChange('visual')}
            disabled={mode === 'json' && !!jsonError}
            className={`${
              mode === 'visual'
                ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
            } whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50`}
          >
            Visual Editor
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('json')}
            className={`${
              mode === 'json'
                ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300'
            } whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium`}
          >
            JSON Editor
          </button>
        </nav>
      </div>

      {mode === 'json' && jsonError && (
        <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
          <p className="text-sm text-red-700 dark:text-red-400">
            Fix JSON errors before switching to Visual Editor
          </p>
        </div>
      )}

      <div className="mt-4">
        {mode === 'visual' ? (
          <VisualEditor
            statements={statements}
            onChange={onChange}
            disabled={disabled}
          />
        ) : (
          <JsonEditor
            statements={statements}
            onChange={onChange}
            onError={setJsonError}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  )
}
