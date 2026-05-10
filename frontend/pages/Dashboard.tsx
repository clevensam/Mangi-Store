import React, { useMemo } from 'react';
import { useQuery, gql } from '@apollo/client';
import { translations, type Language } from '../lib/i18n';
import { formatCurrency, cn } from '../lib/utils';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  TrendingUp, TrendingDown, Package, DollarSign, 
  ShoppingCart, Plus, Receipt, BarChart3, Clock,
  AlertTriangle, PackagePlus, ArrowRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAuth } from '../contexts/AuthContext';

const GET_DASHBOARD_DATA = gql`
  query GetDashboardData {
    dashboardData {
      stats {
        todaySales
        todayOrderCount
        lowStockCount
        inventoryValue
      }
      weeklySales {
        date
        total
      }
      topProducts {
        productId
        productName
        revenue
        quantity
      }
      recentTransactions {
        id
        productId
        productName
        quantity
        totalPrice
        createdAt
      }
      lowStockProducts {
        productId
        productName
        quantity
        threshold
        category
      }
    }
  }
`;

interface DashboardStats {
  todaySales: number;
  todayOrderCount: number;
  lowStockCount: number;
  inventoryValue: number;
}

interface DailySales {
  date: string;
  total: number;
}

interface TopProduct {
  productId: string;
  productName: string;
  revenue: number;
  quantity: number;
}

interface Transaction {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  createdAt: string;
}

interface LowStockProduct {
  productId: string;
  productName: string;
  quantity: number;
  threshold: number;
  category: string;
}

interface DashboardData {
  stats: DashboardStats;
  weeklySales: DailySales[];
  topProducts: TopProduct[];
  recentTransactions: Transaction[];
  lowStockProducts: LowStockProduct[];
}

interface Props {
  lang: Language;
  onNavigate?: (tab: string) => void;
}

export default function DashboardPage({ lang, onNavigate }: Props) {
  const t = translations[lang];
  const { profile } = useAuth();
  const { loading, data } = useQuery(GET_DASHBOARD_DATA);

  const dashboardData = data?.dashboardData as DashboardData | undefined;

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t.goodMorning;
    if (hour < 18) return t.goodAfternoon;
    return t.goodEvening;
  }, [t]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner size={60} thickness={180} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-slate-50 dark:bg-slate-950 relative transition-colors duration-300">
      <div className="pt-6 px-8 pb-4 shrink-0">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-brand-primary to-orange-500 rounded-2xl p-6 shadow-lg shadow-orange-200/50 dark:shadow-none relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {greeting}, {profile?.displayName || 'User'}!
                </h1>
                <p className="text-white/80 font-medium mt-1 text-sm">
                  {getCurrentDate()}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => onNavigate?.('sales')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-brand-primary rounded-xl font-bold text-sm transition-all shadow-lg shadow-black/10 hover:scale-105 active:scale-95"
                >
                  <Plus size={16} />
                  {t.newSale}
                </button>
                <button 
                  onClick={() => onNavigate?.('products')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold text-sm transition-all backdrop-blur-sm hover:scale-105 active:scale-95"
                >
                  <PackagePlus size={16} />
                  {t.addProduct}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 pb-4 shrink-0">
        <div className="max-w-7xl mx-auto">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-xl">
                  <DollarSign size={20} />
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-full">
                  {t.todaysSales}
                </span>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {formatCurrency(dashboardData?.stats.todaySales || 0)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                {dashboardData?.stats.todayOrderCount || 0} {lang === 'en' ? 'orders' : 'maagizo'}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 rounded-xl">
                  <ShoppingCart size={20} />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {dashboardData?.stats.todayOrderCount || 0}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                {t.todaysOrders}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className={cn(
                  "p-2.5 rounded-xl",
                  (dashboardData?.stats.lowStockCount || 0) > 0 
                    ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600" 
                    : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600"
                )}>
                  <AlertTriangle size={20} />
                </div>
              </div>
              <p className={cn(
                "text-2xl font-black tracking-tight",
                (dashboardData?.stats.lowStockCount || 0) > 0 
                  ? "text-amber-600 dark:text-amber-400" 
                  : "text-slate-900 dark:text-slate-100"
              )}>
                {dashboardData?.stats.lowStockCount || 0}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                {t.productsLowStock}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 bg-purple-50 dark:bg-purple-950/30 text-purple-600 rounded-xl">
                  <Package size={20} />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {formatCurrency(dashboardData?.stats.inventoryValue || 0)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                {t.inventoryValue}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 pb-8 no-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Chart */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{t.salesTrend}</h3>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-lg">
                    <TrendingUp size={14} />
                    {lang === 'en' ? 'Last 7 days' : 'Siku 7 zilizopita'}
                  </span>
                </div>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dashboardData?.weeklySales || []}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F97316" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                    <Tooltip 
                      cursor={{stroke: '#F97316', strokeWidth: 1, strokeDasharray: '4 4'}}
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        backgroundColor: '#1e293b',
                        color: '#f8fafc',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.3)', 
                        fontSize: '12px', 
                        fontWeight: 'bold' 
                      }}
                      formatter={(value: number) => [formatCurrency(value), 'Sales']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#F97316" 
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorSales)"
                      dot={{ r: 4, fill: '#fff', stroke: '#F97316', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#F97316', stroke: '#fff', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{t.topProducts}</h3>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {lang === 'en' ? 'By Revenue' : 'Kwa Mapato'}
                </span>
              </div>
              <div className="space-y-4">
                {(dashboardData?.topProducts || []).length === 0 ? (
                  <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                    <Package size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{lang === 'en' ? 'No sales yet' : 'Hakuna mauzo bado'}</p>
                  </div>
                ) : (
                  (dashboardData?.topProducts || []).map((product, index) => (
                    <div key={product.productId} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black",
                        index === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400" :
                        index === 1 ? "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300" :
                        index === 2 ? "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400" :
                        "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                      )}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 dark:text-slate-100 truncate text-sm">
                          {product.productName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {product.quantity} {lang === 'en' ? 'units sold' : 'vipande'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-brand-primary text-sm">
                          {formatCurrency(product.revenue)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Transactions */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{t.recentTransactions}</h3>
                <button className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1">
                  {lang === 'en' ? 'View All' : 'Tazama Zote'}
                  <ArrowRight size={12} />
                </button>
              </div>
              <div className="space-y-3">
                {(dashboardData?.recentTransactions || []).length === 0 ? (
                  <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                    <Clock size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t.noRecentTransactions}</p>
                  </div>
                ) : (
                  (dashboardData?.recentTransactions || []).map((transaction) => (
                    <div key={transaction.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 text-brand-primary flex items-center justify-center">
                        <ShoppingCart size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                          {transaction.productName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Clock size={10} />
                          {formatTime(transaction.createdAt)} • {transaction.quantity} {lang === 'en' ? 'units' : 'vipande'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900 dark:text-slate-100 text-sm">
                          {formatCurrency(transaction.totalPrice)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Low Stock Alerts */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{t.lowStockAlerts}</h3>
                {(dashboardData?.lowStockProducts?.length || 0) > 0 && (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded-full">
                    {(dashboardData?.lowStockProducts?.length || 0)} {lang === 'en' ? 'items' : 'vitu'}
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {(dashboardData?.lowStockProducts || []).length === 0 ? (
                  <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                    <TrendingUp size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t.noLowStockAlerts}</p>
                  </div>
                ) : (
                  (dashboardData?.lowStockProducts || []).map((product) => (
                    <div key={product.productId} className="flex items-center gap-4 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
                        <AlertTriangle size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                          {product.productName}
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                          {product.quantity} / {product.threshold} {lang === 'en' ? 'remaining' : 'imebaki'}
                        </p>
                      </div>
                      <button className="text-xs font-bold text-brand-primary hover:underline">
                        {t.restock}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}