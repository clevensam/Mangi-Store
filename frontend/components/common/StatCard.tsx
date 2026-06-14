import { type LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

function StatCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      'bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow',
      className,
    )}>
      {children}
    </div>
  );
}

function StatCardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between mb-2 sm:mb-3', className)}>
      {children}
    </div>
  );
}

function StatCardIcon({
  icon: Icon,
  variant = 'default',
  className,
}: {
  icon: LucideIcon;
  variant?: 'default' | 'emerald' | 'blue' | 'amber' | 'purple';
  className?: string;
}) {
  const variantClasses: Record<string, string> = {
    default: 'bg-slate-50 dark:bg-slate-800 text-slate-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600',
    blue: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600',
    amber: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600',
    purple: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600',
  };

  return (
    <div className={cn(
      'p-2 sm:p-2.5 rounded-xl',
      variantClasses[variant] || variantClasses.default,
      className,
    )}>
      <Icon size={18} />
    </div>
  );
}

function StatCardBadge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn(
      'text-[9px] sm:text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 px-2 py-1 rounded-full',
      className,
    )}>
      {children}
    </span>
  );
}

function StatCardValue({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn(
      'text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight',
      className,
    )}>
      {children}
    </p>
  );
}

function StatCardLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn(
      'text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium mt-1',
      className,
    )}>
      {children}
    </p>
  );
}

StatCard.Header = StatCardHeader;
StatCard.Icon = StatCardIcon;
StatCard.Badge = StatCardBadge;
StatCard.Value = StatCardValue;
StatCard.Label = StatCardLabel;

export { StatCard };
