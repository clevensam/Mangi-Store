import { cn } from '../../lib/utils';

function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8 pb-0 shrink-0', className)}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 sm:gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {title}
          </h2>
          {description && (
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3 self-start sm:self-auto">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export { PageHeader };
