import React from 'react';
import { type LucideIcon, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface SidebarContextValue {
  collapsed: boolean;
}

const SidebarContext = React.createContext<SidebarContextValue>({ collapsed: false });

function Sidebar({
  collapsed,
  onToggle,
  children,
}: {
  collapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <SidebarContext.Provider value={{ collapsed }}>
      <aside
        className={cn(
          'hidden md:flex bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col shrink-0 z-30 transition-all duration-300 ease-in-out relative',
          collapsed ? 'w-[72px]' : 'w-64',
        )}
      >
        {children}

        <button
          onClick={onToggle}
          className="absolute -right-3 top-8 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-brand-primary hover:border-brand-primary shadow-sm transition-all z-40 hidden md:flex"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>
    </SidebarContext.Provider>
  );
}

function SidebarBrand({ logoSrc, logotypeSrc, to = '/dashboard' }: { logoSrc: string; logotypeSrc?: string; to?: string }) {
  const { collapsed } = React.useContext(SidebarContext);

  return (
    <div className="h-20 flex items-center border-b border-slate-50 dark:border-slate-800 transition-all duration-300 px-5">
      <Link to={to} className="flex items-center gap-3">
        <img src={logoSrc} alt="Mangi" className="h-10 w-10 object-contain shrink-0" />
        {!collapsed && logotypeSrc && (
          <img src={logotypeSrc} alt="Mangi" className="h-6 object-contain" />
        )}
      </Link>
    </div>
  );
}

function SidebarNav({ children }: { children: React.ReactNode }) {
  const { collapsed } = React.useContext(SidebarContext);

  return (
    <nav className={cn(
      'flex-1 px-3 py-6 space-y-8 overflow-y-auto overflow-x-hidden no-scrollbar',
      collapsed && 'px-2',
    )}>
      {children}
    </nav>
  );
}

function SidebarNavGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const { collapsed } = React.useContext(SidebarContext);

  return (
    <div className="space-y-1">
      {!collapsed && (
        <h3 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 opacity-60">
          {title}
        </h3>
      )}
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function SidebarNavItem({
  icon: Icon,
  label,
  to,
  roles,
  can,
}: {
  icon: LucideIcon;
  label: string;
  to: string;
  roles?: string[];
  can?: (...roles: string[]) => boolean;
}) {
  const { collapsed } = React.useContext(SidebarContext);
  const location = useLocation();
  const currentPath = location.pathname.replace('/', '').split('/')[0];
  const isActive = currentPath === to.replace('/', '');

  if (roles && can && !can(...roles)) return null;

  return (
    <Link
      to={to}
      title={collapsed ? label : undefined}
      className={cn(
        'flex items-center w-full rounded-xl transition-all duration-200 group font-bold text-sm h-11',
        collapsed ? 'px-2' : 'px-4',
        isActive
          ? 'bg-orange-50 dark:bg-orange-950/30 text-brand-primary shadow-sm shadow-orange-900/5'
          : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200',
      )}
    >
      <div className={cn(
        'flex items-center justify-center transition-all duration-300',
        collapsed ? 'w-full' : 'w-6 mr-3',
      )}>
        <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
      </div>
      {!collapsed && (
        <span className="whitespace-nowrap">{label}</span>
      )}
    </Link>
  );
}

function SidebarFooter({ children }: { children: React.ReactNode }) {
  const { collapsed } = React.useContext(SidebarContext);

  return (
    <div className={cn(
      'border-t border-slate-50 dark:border-slate-800 px-3 py-4',
      collapsed && 'px-2',
    )}>
      {children}
    </div>
  );
}

function SidebarLogoutButton({ label, onLogout }: { label: string; onLogout: () => void }) {
  const { collapsed } = React.useContext(SidebarContext);

  return (
    <button
      onClick={onLogout}
      className={cn(
        'flex items-center w-full rounded-xl transition-all duration-200 font-bold text-sm h-11 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20',
        collapsed ? 'px-2 justify-center' : 'px-4',
      )}
    >
      <div className={cn('flex items-center justify-center', collapsed ? 'w-full' : 'w-6 mr-3')}>
        <LogOut size={18} />
      </div>
      {!collapsed && <span>{label}</span>}
    </button>
  );
}

Sidebar.Brand = SidebarBrand;
Sidebar.Nav = SidebarNav;
Sidebar.NavGroup = SidebarNavGroup;
Sidebar.NavItem = SidebarNavItem;
Sidebar.Footer = SidebarFooter;
Sidebar.LogoutButton = SidebarLogoutButton;

export { Sidebar };
