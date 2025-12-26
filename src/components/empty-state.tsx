import { PlusIcon } from "@heroicons/react/24/outline";

interface EmptyStateProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  actionLabel: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="text-center border-2 border-dashed border-gray-300 rounded-lg p-12 dark:border-gray-700">
      <Icon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
      <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      <div className="mt-6">
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-x-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          <PlusIcon className="h-5 w-5" aria-hidden="true" />
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
