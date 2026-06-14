import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

function Modal({
  isOpen,
  onClose,
  size = 'md',
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  size?: keyof typeof sizeClasses;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/10 backdrop-blur-md z-[60]"
          />
          <div className="fixed inset-0 z-[70] overflow-y-auto pointer-events-none flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={cn(
                'pointer-events-auto w-full bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 space-y-8 shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-300',
                sizeClasses[size],
              )}
            >
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function ModalHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex justify-between items-center shrink-0', className)}>
      {children}
    </div>
  );
}

function ModalTitleGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('space-y-1', className)}>
      {children}
    </div>
  );
}

function ModalTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight', className)}>
      {children}
    </h3>
  );
}

function ModalSubtitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest', className)}>
      {children}
    </p>
  );
}

function ModalCloseButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl text-slate-400 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700',
        className,
      )}
    >
      <X size={20} />
    </button>
  );
}

function ModalBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('space-y-6 overflow-y-auto pr-1 pb-1 no-scrollbar flex-1', className)}>
      {children}
    </div>
  );
}

function ModalFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('shrink-0 pt-4 border-t border-slate-50 dark:border-slate-800 flex gap-3', className)}>
      {children}
    </div>
  );
}

Modal.Header = ModalHeader;
Modal.TitleGroup = ModalTitleGroup;
Modal.Title = ModalTitle;
Modal.Subtitle = ModalSubtitle;
Modal.CloseButton = ModalCloseButton;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;

export { Modal };
