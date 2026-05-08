import React, { useMemo } from 'react';
import { useQuery, gql } from '@apollo/client';
import { translations, Language } from '../lib/i18n';
import { formatCurrency, cn } from '../lib/utils';
import { ArrowLeft, Package, TrendingUp, History, AlertCircle, ShoppingCart, ArrowUpCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const GET_PRODUCT_DETAILS = gql`
  query GetProductDetails($id: ID!) {
    product(id: $id) {
      id
      name
      category
      buying_price
      selling_price
      quantity
      low_stock_threshold
    }
    productSales(productId: $id) {
      id
      quantity
      total_price
      created_at
    }
  }
`;

interface Product {
  id: string;
  name: string;
  category: string;
  buying_price: number;
  selling_price: number;
  quantity: number;
  low_stock_threshold: number;
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
  productId: string;
  onBack: () => void;
}

export default function ProductDetailsPage({ lang, productId, onBack }: Props) {
  const t = translations[lang];

  const { loading, data } = useQuery(GET_PRODUCT_DETAILS, {
    variables: { id: productId }
  });

  const product = data?.product as Product;
  const sales = data?.productSales as Sale[] || [];
  
  const logs: any[] = []; // Placeholder for backend audit logs

  // Aggregated Monthly Sales Trend
  const chartData = useMemo(() => {
    if (!sales) return [];
    
    const monthlyGroups: { [key: string]: { month: string; qty: number; total: number; timestamp: number } } = {};
    
    sales.forEach(sale => {
      const date = new Date(sale.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString(lang === 'en' ? 'en-US' : 'sw-TZ', { month: 'short', year: '2-digit' });
      
      if (!monthlyGroups[key]) {
        monthlyGroups[key] = {
          month: monthLabel,
          qty: 0,
          total: 0,
          timestamp: new Date(date.getFullYear(), date.getMonth(), 1).getTime()
        };
      }
      monthlyGroups[key].qty += sale.quantity;
      monthlyGroups[key].total += sale.total_price;
    });
    
    // Convert to array and sort by date
    return Object.values(monthlyGroups)
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-6); // Show last 6 months
  }, [sales, lang]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="h-8 w-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) return null;

  const totalSold = sales?.reduce((sum, s) => sum + s.quantity, 0) || 0;
  const totalRevenue = sales?.reduce((sum, s) => sum + s.total_price, 0) || 0;
  const profitPerUnit = product.selling_price - product.buying_price;
  const totalPotentialProfit = profitPerUnit * totalSold;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto transition-colors duration-300">
      <div className="p-8 sticky top-0 z-10 flex items-center gap-4 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md">
        <button 
          onClick={onBack}
          className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 hover:text-brand-primary dark:hover:text-brand-primary hover:bg-orange-50 dark:hover:bg-orange-950/30 transition-all shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">{product.name}</h2>
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{product.category}</p>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-5xl mx-auto w-full">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 text-brand-primary flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
              <Package size={20} />
            </div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{t.currentStock}</p>
            <p className={cn("text-3xl font-bold tracking-tight", product.quantity <= product.low_stock_threshold ? "text-rose-600" : "text-slate-900 dark:text-slate-100")}>
              {product.quantity} <span className="text-sm font-medium text-slate-400 dark:text-slate-500">{t.unit}s</span>
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
              <TrendingUp size={20} />
            </div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{t.totalSold}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {totalSold} <span className="text-sm font-medium text-slate-400 dark:text-slate-500">{t.unit}s</span>
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-slate-800 text-white dark:text-slate-300 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
              <History size={20} />
            </div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{t.totalRevenue}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {formatCurrency(totalRevenue)}
            </p>
          </div>
        </div>

        {/* Details & Pricing */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
              <History size={16} className="text-brand-primary" />
              {t.pricingStructure}
            </h4>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800">
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t.buyingPrice}</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(product.buying_price)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800">
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t.sellingPrice}</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(product.selling_price)}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-50 dark:border-slate-800">
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t.profitPerUnit}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-500">{formatCurrency(profitPerUnit)}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t.margin}</span>
                <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-500 rounded-lg text-xs font-bold">
                  {Math.round((profitPerUnit / product.buying_price) * 100)}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col">
            <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-6">{t.monthlySalesTrend}</h4>
            <div className="flex-1 min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorQty" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: 'currentColor', fontSize: 10, fontWeight: 700}}
                    className="text-slate-400 dark:text-slate-600"
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{stroke: '#f97316', strokeWidth: 2}}
                    contentStyle={{
                      borderRadius: '16px', 
                      border: 'none', 
                      backgroundColor: 'var(--tooltip-bg, #1e293b)',
                      color: 'var(--tooltip-text, #f8fafc)',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                    }}
                    labelStyle={{fontWeight: 800, color: 'inherit', marginBottom: '4px'}}
                    itemStyle={{color: 'inherit'}}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="qty" 
                    stroke="#f97316" 
                    strokeWidth={4} 
                    fillOpacity={1}
                    fill="url(#colorQty)"
                    dot={{r: 6, fill: '#f97316', strokeWidth: 2, stroke: '#fff'}}
                    activeDot={{r: 8, strokeWidth: 0}}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* History Tabs */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 dark:border-slate-800">
             <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">{t.inventoryActivityLog}</h4>
          </div>
          
          <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {logs?.map((log, idx) => (
              <div key={idx} className="p-6 flex items-start gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <div className={cn(
                  "p-2 rounded-xl shrink-0",
                  log.action === 'SALE' ? "bg-orange-50 dark:bg-orange-950/30 text-brand-primary" : 
                  log.action === 'RESTOCK' ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                )}>
                  {log.action === 'SALE' ? <ShoppingCart size={16} /> : 
                   log.action === 'RESTOCK' ? <ArrowUpCircle size={16} /> : <AlertCircle size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{log.details}</p>
                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{log.action}</p>
                </div>
              </div>
            ))}
            {logs?.length === 0 && (
              <div className="p-12 text-center text-slate-400 dark:text-slate-500 text-sm font-medium">
                {t.noActivityLogs}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
