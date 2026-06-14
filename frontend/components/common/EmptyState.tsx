import { type LucideIcon, Search } from 'lucide-react';
import { cn } from '../../lib/utils';

function EmptyState({
  icon: Icon = Search,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}) {
  return (
    <div className={cn('py-16 sm:py-32 text-center', className)}>
      <div className="inline-flex p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-full text-slate-200 dark:text-slate-800 mb-4 sm:mb-6 shadow-sm border border-slate-50 dark:border-slate-800 transition-colors">
        <Icon size={48} />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h3>
      {description && (
        <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 mt-2 max-w-sm mx-auto px-4">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 sm:mt-6 text-brand-primary font-bold hover:underline text-sm"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export { EmptyState };
