import React, { useMemo } from 'react';
import { useQuery, gql } from '@apollo/client';
import { translations, type Language } from '../lib/i18n';
import { formatCurrency, cn } from '../lib/utils';
import { TrendingUp, AlertTriangle, ArrowRight, PackageOpen, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const GET_DASHBOARD_DATA = gql`
  query GetDashboardData {
    products {
      id
      name
      quantity
      low_stock_threshold
      selling_price
    }
    sales {
      id
      product_id
      quantity
      total_price
      created_at
    }
  }
`;

interface Product {
  id: string;
  name: string;
  quantity: number;
  low_stock_threshold: number;
  selling_price: number;
}

interface Sale {
  id: string;
  product_id: string;
  quantity: number;
  total_price: number;
  created_at: string;
}

interface Props {
  lang: Language;
}

export default function DashboardPage({ lang }: Props) {
  const t = translations[lang];
  const { loading, data } = useQuery(GET_DASHBOARD_DATA);

  const products = data?.products as Product[] || [];
  const sales = data?.sales as Sale[] || [];

  const totals = { business: 0, drawings: 0 };
  
  const totalSalesToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return sales
      .filter(s => s.created_at.startsWith(today))
      .reduce((sum, s) => sum + s.total_price, 0);
  }, [sales]);

  const highTurnoverItems = products.filter(p => p.quantity < 20); // Simple logic for demo
  const lowStockItems = products.filter(p => p.quantity <= p.low_stock_threshold);
  
  const healthScore = totalSalesToday > 50000 ? 'good' : totalSalesToday > 0 ? 'neutral' : 'warning';

  const chartData = [
    { name: 'Mon', total: 4000 },
    { name: 'Tue', total: 3000 },
    { name: 'Wed', total: 2000 },
    { name: 'Thu', total: 2780 },
    { name: 'Fri', total: 1890 },
    { name: 'Sat', total: 2390 },
    { name: 'Sun', total: totalSalesToday || 1200 },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative overflow-y-auto pb-20 transition-colors duration-300">
      <div className="pt-8 px-8 pb-0 shrink-0">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{t.dashboard}</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">{t.overviewPerformance}</p>
        </div>
      </div>

      <div className="pt-4 px-8 space-y-6">
        {/* Health Score Banner */}
      <div className={cn(
        "p-4 rounded-2xl flex items-center justify-between border shadow-sm transition-all",
        healthScore === 'good' ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900 text-emerald-800 dark:text-emerald-400" :
        healthScore === 'neutral' ? "bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900 text-amber-800 dark:text-amber-400" :
        "bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900 text-rose-800 dark:text-rose-400"
      )}>
        <div className="flex items-center gap-3">
          {healthScore !== 'warning' ? <TrendingUp size={18} /> : <AlertTriangle size={18} />}
          <span className="font-bold text-sm tracking-tight">
            {healthScore === 'good' ? t.businessGrowing : t.noSalesToday}
          </span>
        </div>
        <div className="h-6 w-6 rounded-full bg-white/50 dark:bg-slate-800/50 flex items-center justify-center">
          <ArrowRight size={14} />
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-orange-50 dark:bg-orange-950/30 text-brand-primary rounded-lg">
              <TrendingUp size={16} />
            </div>
            {highTurnoverItems.length > 0 && (
              <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-md tracking-tighter transition-all">
                {t.highTurnover}
              </span>
            )}
          </div>
          <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.15em] mb-1">{t.turnoverRate}</p>
          <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-none">{lowStockItems.length} {t.all}</p>
        </div>

        <div className="stat-card">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg">
              <PackageOpen size={16} />
            </div>
          </div>
          <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.15em] mb-1">{t.deadStock}</p>
          <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-none">0</p>
        </div>

        {/* Financial Discipline Card */}
        <div className="stat-card">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/30 text-blue-600 rounded-lg">
              <Activity size={16} />
            </div>
            <span className="text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded-md tracking-tighter uppercase">{t.financialDiscipline}</span>
          </div>
          <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.15em] mb-1">{t.drawings}</p>
          <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-none">{formatCurrency(totals.drawings)}</p>
        </div>

        <div className="stat-card">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-lg">
              <TrendingUp size={16} />
            </div>
            <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded-md tracking-tighter uppercase whitespace-nowrap">{t.profit}</span>
          </div>
          <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[0.15em] mb-1">{t.business}</p>
          <p className="text-2xl font-bold tracking-tight text-emerald-600 leading-none">{formatCurrency(totalSalesToday * 0.2 - totals.business)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analytics Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6 transition-colors duration-300">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{t.reports}</h3>
            <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-lg text-[10px] font-bold">
              <button className="px-3 py-1.5 bg-white dark:bg-slate-700 shadow-sm rounded-md uppercase tracking-wider text-slate-800 dark:text-slate-100">{t.weekly}</button>
              <button className="px-3 py-1.5 text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t.monthly}</button>
            </div>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                <XAxis dataKey="name" hide />
                <Tooltip 
                  cursor={{stroke: '#F97316', strokeWidth: 1}}
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    backgroundColor: 'var(--tooltip-bg, #1e293b)',
                    color: 'var(--tooltip-text, #f8fafc)',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.2)', 
                    fontSize: '12px', 
                    fontWeight: 'bold' 
                  }}
                  itemStyle={{ color: 'inherit' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#F97316" 
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                  dot={{ r: 4, fill: '#fff', stroke: '#F97316', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between px-4 text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest leading-loose">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>

        {/* Recent Actions / Audit Log */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6 flex flex-col h-full transition-colors duration-300">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{t.recentActions}</h3>
          <div className="space-y-6 flex-1 overflow-y-auto pr-1 no-scrollbar">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="flex items-start group cursor-pointer">
                <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center shrink-0 group-hover:bg-orange-50 dark:group-hover:bg-orange-950/30 group-hover:text-brand-primary transition-colors duration-300">
                  <PackageOpen size={18} />
                </div>
                <div className="ml-4 space-y-0.5 min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Added {25 * i}x Milk 1L</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">10:45 AM • AlexSterling</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
