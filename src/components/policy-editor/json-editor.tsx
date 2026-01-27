'use client'

import { useState, useEffect } from 'react'
import type { StatementDto } from '@/lib/api/models'

interface JsonEditorProps {
  statements: StatementDto[]
  onChange: (statements: StatementDto[]) => void
  onError: (error: string | null) => void
  disabled?: boolean
}

export function JsonEditor({ statements, onChange, onError, disabled }: JsonEditorProps) {
  const [jsonText, setJsonText] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    setJsonText(JSON.stringify(statements, null, 2))
    setLocalError(null)
  }, [statements])

  const handleChange = (value: string) => {
    setJsonText(value)

    try {
      const parsed = JSON.parse(value)

      if (!Array.isArray(parsed)) {
        const error = 'Statements must be an array'
        setLocalError(error)
        onError(error)
        return
      }

      for (let i = 0; i < parsed.length; i++) {
        const stmt = parsed[i]
        if (typeof stmt.effect !== 'string' || !['Allow', 'Deny'].includes(stmt.effect)) {
          const error = `Statement ${i + 1}: effect must be "Allow" or "Deny"`
          setLocalError(error)
          onError(error)
          return
        }
        if (!Array.isArray(stmt.actions)) {
          const error = `Statement ${i + 1}: actions must be an array`
          setLocalError(error)
          onError(error)
          return
        }
        if (!Array.isArray(stmt.resources)) {
          const error = `Statement ${i + 1}: resources must be an array`
          setLocalError(error)
          onError(error)
          return
        }
      }

      setLocalError(null)
      onError(null)
      onChange(parsed)
    } catch {
      const error = 'Invalid JSON syntax'
      setLocalError(error)
      onError(error)
    }
  }

  return (
    <div className="space-y-2">
      <textarea
        value={jsonText}
        onChange={(e) => handleChange(e.target.value)}
        disabled={disabled}
        rows={20}
        spellCheck={false}
        className={`block w-full rounded-md border px-3 py-2 font-mono text-sm shadow-sm focus:outline-none focus:ring-1 disabled:bg-gray-100 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800 ${
          localError
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-600'
            : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600'
        }`}
      />
      {localError && (
        <p className="text-sm text-red-600 dark:text-red-400">{localError}</p>
      )}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Edit the policy statements as JSON. Each statement requires: effect (Allow/Deny), actions (array), resources (array).
      </p>
    </div>
  )
}
