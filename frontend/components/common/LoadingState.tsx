import LoadingSpinner from '../LoadingSpinner';
import { cn } from '../../lib/utils';

function LoadingState({ className, size = 60 }: { className?: string; size?: number }) {
  return (
    <div className={cn('flex-1 flex items-center justify-center', className)}>
      <LoadingSpinner size={size} thickness={180} />
    </div>
  );
}

export { LoadingState };
