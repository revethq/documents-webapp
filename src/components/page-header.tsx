import { PlusIcon } from "@heroicons/react/24/outline";

interface PageHeaderProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  actionDisabledReason?: string;
}

export default function PageHeader({
  title,
  description,
  actionLabel,
  onAction,
  actionDisabled,
  actionDisabledReason,
}: PageHeaderProps) {
  return (
    <div className="sm:flex sm:items-center">
      <div className="sm:flex-auto">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{title}</h1>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-400">{description}</p>
      </div>
      {actionLabel && (
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={onAction}
            disabled={actionDisabled}
            title={actionDisabled ? actionDisabledReason : undefined}
            className={`flex items-center gap-x-2 rounded-md px-3 py-2 text-center text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
              actionDisabled
                ? 'cursor-not-allowed bg-indigo-400 dark:bg-indigo-600/50'
                : 'bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400'
            }`}
          >
            <PlusIcon className="h-5 w-5" aria-hidden="true" />
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}
