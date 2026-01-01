export function ErrorBanner({
  message,
  onDismiss,
}: {
  message: string
  onDismiss?: () => void
}) {
  return (
    <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
      <div className="flex items-start justify-between gap-4">
        <p>{message}</p>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs font-medium text-red-700 hover:text-red-900 dark:text-red-200 dark:hover:text-white"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  )
}
