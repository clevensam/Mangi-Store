import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Receipt, Globe, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, CreditCard, Users, BarChart3, Settings, Search, Bell, LogIn, BrainCircuit, MoreHorizontal, Warehouse, DollarSign } from 'lucide-react';
import BrandLogo from '../Brandlogo.svg';
import BrandName from '../Brandname.svg';
import { cn } from './lib/utils';
import { translations, type Language } from './lib/i18n';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './contexts/AuthContext';
import AuthPage from './pages/Auth';
import DashboardPage from './pages/Dashboard';
import SalesPage from './pages/Sales';
import StockPage from './pages/Stock';
import ProductsPage from './pages/Products';
import ExpensesPage from './pages/Expenses';
import DebtsPage from './pages/Debts';
import CustomersPage from './pages/Customers';
import SettingsPage from './pages/Settings';
import ReportsPage from './pages/Reports';
import AnalysisPage from './pages/Analysis';
import ProductDetailsPage from './pages/ProductDetails';

function AppLayout() {
  const { user, profile, isOwner, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('lang') as Language) || 'en';
  });

  const t = translations[lang];
  const currentPath = location.pathname.replace('/', '').split('/')[0];

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  const navGroups = [
    {
      id: 'main',
      title: lang === 'en' ? 'Main' : 'Kuu',
      items: [
        { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard, path: '/dashboard' },
        { id: 'sales', label: t.sales, icon: ShoppingCart, path: '/sales' },
        { id: 'reports', label: t.hesabu, icon: BarChart3, path: '/reports' },
        { id: 'analysis', label: t.analysis, icon: BrainCircuit, path: '/analysis' },
      ]
    },
    {
      id: 'inventory',
      title: lang === 'en' ? 'Inventory' : 'Hesabu',
      items: [
        { id: 'products', label: t.products, icon: Package, path: '/products' },
        { id: 'stock', label: t.stock, icon: Package, path: '/stock' },
        { id: 'expenses', label: t.expenses, icon: Receipt, path: '/expenses' },
      ]
    }, 
    {
      id: 'management',
      title: lang === 'en' ? 'Management' : 'Usimamizi',
      items: [
        { id: 'debts', label: t.debts, icon: CreditCard, path: '/debts' },
        { id: 'customers', label: t.customers, icon: Users, path: '/customers' },
      ]
    },
    {
      id: 'system',
      title: lang === 'en' ? 'System' : 'Mfumo',
      items: [
        { id: 'settings', label: t.settings, icon: Settings, path: '/settings' },
      ]
    }
  ];

  const renderPage = () => {
    const path = location.pathname;
    
    if (path.startsWith('/product/')) {
      const productId = path.split('/product/')[1];
      return (
        <ProductDetailsPage 
          lang={lang} 
          productId={productId} 
          onBack={() => navigate(-1)} 
        />
      );
    }

    switch (path) {
      case '/dashboard':
        return <DashboardPage lang={lang} onNavigate={(tab) => navigate(`/${tab}`)} />;
      case '/sales':
        return <SalesPage lang={lang} />;
      case '/products':
        return <ProductsPage lang={lang} onViewDetails={(id) => navigate(`/product/${id}`)} />;
      case '/stock':
        return <StockPage lang={lang} onViewDetails={(id) => navigate(`/product/${id}`)} />;
      case '/expenses':
        return <ExpensesPage lang={lang} />;
      case '/debts':
        return <DebtsPage lang={lang} />;
      case '/customers':
        return <CustomersPage lang={lang} />;
      case '/reports':
        return <ReportsPage lang={lang} />;
      case '/analysis':
        return <AnalysisPage lang={lang} />;
      case '/settings':
        return <SettingsPage lang={lang} />;
      default:
        return <DashboardPage lang={lang} onNavigate={(tab) => navigate(`/${tab}`)} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 overflow-hidden font-sans transition-colors duration-300">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden md:flex bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col shrink-0 z-30 transition-all duration-300 ease-in-out relative",
        isCollapsed ? "w-[72px]" : "w-64"
      )}>
        <div className={cn(
          "h-20 flex items-center border-b border-slate-50 dark:border-slate-800 transition-all duration-300",
          "px-5"
        )}>
          <Link to="/dashboard" className="flex items-center gap-3">
            <img src={BrandLogo} alt="Mangi" className="h-10 w-10 object-contain shrink-0" />
            {!isCollapsed && (
              <motion.img 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }} 
                src={BrandName}
                alt="Mangi"
                className="h-6 object-contain"
              />
            )}
          </Link>
        </div>

        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-8 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-brand-primary hover:border-brand-primary shadow-sm transition-all z-40 hidden md:flex"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
        
        <nav className="flex-1 px-3 py-6 space-y-8 overflow-y-auto overflow-x-hidden no-scrollbar">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!isCollapsed && (
                <h3 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 opacity-60">
                  {group.title}
                </h3>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPath === item.path.replace('/', '') || 
                    (item.path !== '/' && currentPath.startsWith(item.path.replace('/', '')));
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      title={isCollapsed ? item.label : undefined}
                      className={cn(
                        "flex items-center w-full rounded-xl transition-all duration-200 group font-bold text-sm h-11",
                        isCollapsed ? "px-2" : "px-4",
                        isActive 
                          ? "bg-orange-50 dark:bg-orange-950/30 text-brand-primary shadow-sm shadow-orange-900/5" 
                          : "text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200"
                      )}
                    >
                      <div className={cn(
                        "flex items-center justify-center transition-all duration-300",
                        isCollapsed ? "w-full" : "w-6 mr-3"
                      )}>
                        <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                      </div>
                      {!isCollapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="whitespace-nowrap"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex h-16 md:h-20 items-center justify-between px-3 sm:px-6 lg:px-8 shrink-0 relative z-30 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)] transition-colors duration-300">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <img src={BrandLogo} alt="Mangi" className="md:hidden h-8 w-8 sm:h-9 sm:w-9 object-contain shrink-0" />
            {currentPath === 'dashboard' && (
              <h1 className="text-lg sm:text-2xl font-black text-[#1E293B] dark:text-slate-100 tracking-tight font-sans truncate">
                {t.dashboard}
              </h1>
            )}
          </div>

          <div className="hidden lg:flex flex-1 max-w-md xl:max-w-lg mx-4 xl:mx-12">
            <div className="relative w-full group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" size={18} />
              <input 
                type="text" 
                placeholder={t.searchPlaceholder} 
                className="w-full h-10 xl:h-12 pl-12 pr-6 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full text-sm font-medium focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:bg-white dark:focus:bg-slate-700 focus:border-brand-primary/20 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
            <div className="flex items-center gap-1 sm:gap-2 mr-0 sm:mr-2">
              <button 
                onClick={() => setLang(lang === 'en' ? 'sw' : 'en')}
                className="h-9 sm:h-10 px-2 sm:px-3 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center gap-1 sm:gap-2 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 text-xs sm:text-sm font-bold"
              >
                <span className="text-base sm:text-lg">{lang === 'en' ? '🇬🇧' : '🇹🇿'}</span>
                <span className="uppercase tracking-wider hidden xs:inline">{lang === 'en' ? 'EN' : 'SW'}</span>
              </button>
              
              <button className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-brand-primary transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-600 relative group">
                <Bell size={16} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-800 group-hover:scale-110 transition-transform"></span>
              </button>
              
              <Link
                to="/settings"
                className="hidden sm:flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-brand-primary transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
              >
                <Settings size={16} />
              </Link>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-slate-100 dark:border-slate-800">
              <div className="text-right hidden md:block">
                <p className="text-sm font-black text-slate-900 dark:text-slate-100 leading-none">
                  {profile?.displayName || 'User'}
                </p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                  {profile?.role === 'owner' ? t.owner : (lang === 'en' ? 'Staff' : 'Mfanyakazi')}
                </p>
              </div>
              <button 
                onClick={() => signOut()}
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-700 shadow-sm overflow-hidden flex items-center justify-center ring-1 ring-slate-100 dark:ring-slate-700 cursor-pointer hover:ring-rose-500/30 transition-all group"
                title="Sign Out"
              >
                <img 
                  src={`https://ui-avatars.com/api/?name=${profile?.displayName || 'User'}&background=random`} 
                  alt="User avatar"
                  className="h-full w-full object-cover group-hover:opacity-20 transition-opacity"
                  referrerPolicy="no-referrer"
                />
                <LogIn className="absolute opacity-0 group-hover:opacity-100 text-rose-500 transition-opacity" size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pb-28 md:pb-6 relative scroll-smooth no-scrollbar">
          <div className="w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {renderPage()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Mobile Bottom Navigation - Primary 5 items + More */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-1 sm:px-2 pb-safe z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] transition-colors duration-300">
          <div className="flex items-center justify-around max-w-lg mx-auto">
            {/* Dashboard */}
            <MobileNavItem
              icon={LayoutDashboard}
              label={t.dashboard}
              path="/dashboard"
              currentPath={currentPath}
            />
            {/* Sales */}
            <MobileNavItem
              icon={ShoppingCart}
              label={t.sales}
              path="/sales"
              currentPath={currentPath}
            />
            {/* Products */}
            <MobileNavItem
              icon={Package}
              label={t.products}
              path="/products"
              currentPath={currentPath}
            />
            {/* Reports */}
            <MobileNavItem
              icon={BarChart3}
              label={t.hesabu}
              path="/reports"
              currentPath={currentPath}
            />
            {/* More */}
            <button
              onClick={() => setShowMobileMenu(true)}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 px-2 sm:px-3 rounded-xl transition-all duration-300 min-w-[56px] sm:min-w-[64px]",
                showMobileMenu ? "text-brand-primary bg-orange-50 dark:bg-orange-950/30" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              )}
            >
              <MoreHorizontal size={22} strokeWidth={2} />
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] whitespace-nowrap">
                {lang === 'en' ? 'More' : 'Zaidi'}
              </span>
            </button>
          </div>
        </nav>

        {/* Mobile More Menu - Bottom Sheet */}
        <AnimatePresence>
          {showMobileMenu && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowMobileMenu(false)}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 md:hidden"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white dark:bg-slate-900 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] border-t border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center justify-center pt-3 pb-1">
                  <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                </div>
                <div className="px-4 pt-2 pb-6">
                  <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 mb-2">
                    {lang === 'en' ? 'More Options' : 'Chaguo Zaidi'}
                  </h3>
                  <div className="grid grid-cols-4 gap-1">
                    {navGroups.flatMap(group => group.items).filter(item => !['dashboard', 'sales', 'products', 'reports'].includes(item.id)).map((item) => {
                      const Icon = item.icon;
                      const isActive = currentPath === item.path.replace('/', '') || 
                        (item.path !== '/' && currentPath.startsWith(item.path.replace('/', '')));
                      return (
                        <Link
                          key={item.id}
                          to={item.path}
                          onClick={() => setShowMobileMenu(false)}
                          className={cn(
                            "flex flex-col items-center gap-1 py-3 px-1 rounded-2xl transition-all duration-200",
                            isActive ? "text-brand-primary bg-orange-50 dark:bg-orange-950/30" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                          )}
                        >
                          <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                          <span className={cn("text-[9px] font-black uppercase tracking-[0.1em] text-center leading-tight", isActive ? "opacity-100" : "opacity-60")}>
                            {item.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MobileNavItem({ icon: Icon, label, path, currentPath }: { icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; label: string; path: string; currentPath: string }) {
  const isActive = currentPath === path.replace('/', '') || 
    (path !== '/' && currentPath.startsWith(path.replace('/', '')));
  return (
    <Link
      to={path}
      className={cn(
        "flex flex-col items-center gap-0.5 py-2 px-2 sm:px-3 rounded-xl transition-all duration-300 min-w-[56px] sm:min-w-[64px]",
        isActive ? "text-brand-primary bg-orange-50 dark:bg-orange-950/30" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
      )}
    >
      <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
      <span className={cn("text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] whitespace-nowrap", isActive ? "opacity-100" : "opacity-60")}>
        {label}
      </span>
    </Link>
  );
}

function MainRoutes() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={
        user ? <Navigate to="/dashboard" replace /> : <AuthPage lang={(localStorage.getItem('lang') as Language) || 'en'} mode="login" />
      } />
      <Route path="/register" element={
        user ? <Navigate to="/dashboard" replace /> : <AuthPage lang={(localStorage.getItem('lang') as Language) || 'en'} mode="register" />
      } />
      <Route path="/*" element={
        user ? <AppLayout /> : <Navigate to="/login" state={{ from: location }} replace />
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <MainRoutes />
    </BrowserRouter>
  );
}