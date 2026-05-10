import React, { useState, useMemo } from 'react';
import { useQuery, gql } from '@apollo/client';
import { translations, type Language } from '../lib/i18n';
import { formatCurrency, cn } from '../lib/utils';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  TrendingUp, TrendingDown, AlertTriangle, PackageX, Target, 
  BarChart3, PiggyBank, Warehouse, BrainCircuit, DollarSign,
  Package, AlertCircle, CheckCircle, ArrowUp, ArrowDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const GET_SALES_ANALYSIS = gql`
  query GetSalesAnalysis($startDate: String, $endDate: String) {
    salesAnalysis(startDate: $startDate, endDate: $endDate) {
      totalRevenue
      totalCost
      grossProfit
      profitMargin
      transactionCount
      averageTransactionValue
    }
    deadStockAnalysis(startDate: $startDate, endDate: $endDate) {
      productId
      productName
      quantity
      category
      lastSaleDate
      daysSinceLastSale
    }
    profitabilityAnalysis(startDate: $startDate, endDate: $endDate) {
      productId
      productName
      category
      revenue
      cost
      profit
      marginPercent
      unitsSold
    }
    inventoryHealth {
      lowStock {
        productId
        productName
        category
        quantity
        threshold
      }
      overstocked {
        productId
        productName
        category
        quantity
        threshold
      }
      outOfStock {
        productId
        productName
        category
        quantity
        threshold
      }
      inventoryValue
      potentialProfit
    }
    businessInsights(startDate: $startDate, endDate: $endDate) {
      topRevenueProducts {
        productId
        productName
        category
        revenue
        profit
        marginPercent
      }
      topProfitProducts {
        productId
        productName
        category
        revenue
        profit
        marginPercent
      }
      worstMarginProducts {
        productId
        productName
        category
        revenue
        profit
        marginPercent
      }
    }
  }
`;

type PeriodType = 'week' | 'month' | '3months' | '6months';
type TabType = 'sales' | 'deadstock' | 'profitability' | 'inventory' | 'insights';

interface Props {
  lang: Language;
}

export default function AnalysisPage({ lang }: Props) {
  const t = translations[lang];
  const [period, setPeriod] = useState<PeriodType>('month');
  const [activeTab, setActiveTab] = useState<TabType>('sales');

  const dateRange = useMemo(() => {
    const end = new Date();
    const start = new Date();
    
    switch (period) {
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setDate(start.getDate() - 30);
        break;
      case '3months':
        start.setDate(start.getDate() - 90);
        break;
      case '6months':
        start.setDate(start.getDate() - 180);
        break;
    }
    
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
  }, [period]);

  const { loading, data, error } = useQuery(GET_SALES_ANALYSIS, {
    variables: {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    }
  });

  const salesAnalysis = data?.salesAnalysis;
  const deadStock = data?.deadStockAnalysis || [];
  const profitability = data?.profitabilityAnalysis || [];
  const inventoryHealth = data?.inventoryHealth;
  const businessInsights = data?.businessInsights;

  const tabs = [
    { id: 'sales', label: t.salesPerformance, icon: TrendingUp },
    { id: 'deadstock', label: t.deadStockAnalysis, icon: PackageX },
    { id: 'profitability', label: t.profitability, icon: PiggyBank },
    { id: 'inventory', label: t.inventoryHealth, icon: Warehouse },
    { id: 'insights', label: t.businessInsights, icon: BrainCircuit }
  ] as const;

  const renderSalesTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-lg">
              <DollarSign size={18} />
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t.totalRevenue}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {formatCurrency(salesAnalysis?.totalRevenue || 0)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-rose-50 dark:bg-rose-950/30 text-rose-600 rounded-lg">
              <TrendingDown size={18} />
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t.totalCost}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {formatCurrency(salesAnalysis?.totalCost || 0)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/30 text-blue-600 rounded-lg">
              <PiggyBank size={18} />
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t.grossProfit}</p>
          <p className={cn(
            "text-2xl font-bold mt-1",
            (salesAnalysis?.grossProfit || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          )}>
            {formatCurrency(salesAnalysis?.grossProfit || 0)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-orange-50 dark:bg-orange-950/30 text-brand-primary rounded-lg">
              <Target size={18} />
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t.profitMargin}</p>
          <p className={cn(
            "text-2xl font-bold mt-1",
            (salesAnalysis?.profitMargin || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          )}>
            {(salesAnalysis?.profitMargin || 0).toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t.transactionCount}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {salesAnalysis?.transactionCount || 0}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t.avgTransactionValue}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {formatCurrency(salesAnalysis?.averageTransactionValue || 0)}
          </p>
        </div>
      </div>
    </div>
  );

  const renderDeadStockTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{t.deadStockAnalysis}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {deadStock.length} {lang === 'en' ? 'products with no sales' : 'bidhaa zisizoouzwa'}
            </p>
          </div>
          <div className={cn(
            "p-3 rounded-xl",
            deadStock.length === 0 ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-amber-50 dark:bg-amber-950/30"
          )}>
            {deadStock.length === 0 ? (
              <CheckCircle className="text-emerald-600" size={24} />
            ) : (
              <AlertTriangle className="text-amber-600" size={24} />
            )}
          </div>
        </div>

        {deadStock.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="mx-auto text-emerald-500 mb-3" size={48} />
            <p className="text-slate-500 dark:text-slate-400">{t.noDeadStock}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">{t.product}</th>
                  <th className="py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider text-right">{t.quantity}</th>
                  <th className="py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider text-right">{t.daysSinceLastSale}</th>
                  <th className="py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider text-center">{t.category}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {deadStock.slice(0, 10).map((item: any) => (
                  <tr key={item.productId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{item.productName}</span>
                    </td>
                    <td className="py-4 text-right font-bold text-slate-700 dark:text-slate-300">
                      {item.quantity}
                    </td>
                    <td className="py-4 text-right">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold",
                        item.daysSinceLastSale > 60 ? "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400" :
                        item.daysSinceLastSale > 30 ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" :
                        "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                      )}>
                        {item.daysSinceLastSale === 999 ? 'Never' : `${item.daysSinceLastSale} days`}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <span className="text-sm text-slate-500 dark:text-slate-400">{item.category}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderProfitabilityTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-lg">
              <ArrowUp size={18} />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{t.topProfit}</h3>
          </div>
          <div className="space-y-4">
            {profitability.slice(0, 5).map((item: any, index: number) => (
              <div key={item.productId} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">{item.productName}</p>
                    <p className="text-xs text-slate-500">{item.unitsSold} {t.soldUnits}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(item.profit)}</p>
                  <p className="text-xs text-slate-500">{item.marginPercent.toFixed(1)}% {t.margin}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-rose-50 dark:bg-rose-950/30 text-rose-600 rounded-lg">
              <ArrowDown size={18} />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{t.worstMargin}</h3>
          </div>
          <div className="space-y-4">
            {[...profitability].reverse().slice(0, 5).map((item: any, index: number) => (
              <div key={item.productId} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-slate-100">{item.productName}</p>
                    <p className="text-xs text-slate-500">{item.revenue.toLocaleString()} {t.revenue}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-rose-600 dark:text-rose-400">{formatCurrency(item.profit)}</p>
                  <p className="text-xs text-slate-500">{item.marginPercent.toFixed(1)}% {t.margin}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderInventoryTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/30 text-amber-600 rounded-lg">
              <AlertTriangle size={18} />
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t.lowStockItems}</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {inventoryHealth?.lowStock?.length || 0}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/30 text-blue-600 rounded-lg">
              <Package size={18} />
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t.overstockedItems}</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {inventoryHealth?.overstocked?.length || 0}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-rose-50 dark:bg-rose-950/30 text-rose-600 rounded-lg">
              <AlertCircle size={18} />
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t.outOfStock}</p>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {inventoryHealth?.outOfStock?.length || 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t.inventoryValue}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
            {formatCurrency(inventoryHealth?.inventoryValue || 0)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t.potentialProfit}</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(inventoryHealth?.potentialProfit || 0)}
          </p>
        </div>
      </div>

      {(inventoryHealth?.lowStock?.length > 0 || inventoryHealth?.outOfStock?.length > 0) && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 mb-4">{t.recommendations}</h3>
          <div className="space-y-3">
            {inventoryHealth?.outOfStock?.map((item: any) => (
              <div key={item.productId} className="flex items-center gap-3 p-3 bg-rose-50 dark:bg-rose-950/20 rounded-xl">
                <AlertCircle className="text-rose-600 shrink-0" size={18} />
                <p className="text-sm font-medium text-rose-800 dark:text-rose-300">
                  <span className="font-bold">{item.productName}</span> {lang === 'en' ? 'is out of stock - Restock immediately' : 'haina stock - Ongeza haraka'}
                </p>
              </div>
            ))}
            {inventoryHealth?.lowStock?.slice(0, 5).map((item: any) => (
              <div key={item.productId} className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl">
                <AlertTriangle className="text-amber-600 shrink-0" size={18} />
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  <span className="font-bold">{item.productName}</span> {lang === 'en' ? `is low on stock (${item.quantity}/${item.threshold}) - Consider restocking` : `ina stock ya chini (${item.quantity}/${item.threshold}) - Lingua kuziongeza`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderInsightsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-lg">
              <TrendingUp size={18} />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{t.topRevenue}</h3>
          </div>
          <div className="space-y-3">
            {businessInsights?.topRevenueProducts?.map((item: any, index: number) => (
              <div key={item.productId} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.productName}</span>
                </div>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(item.revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/30 text-blue-600 rounded-lg">
              <PiggyBank size={18} />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{t.topProfit}</h3>
          </div>
          <div className="space-y-3">
            {businessInsights?.topProfitProducts?.map((item: any, index: number) => (
              <div key={item.productId} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.productName}</span>
                </div>
                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(item.profit)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-rose-50 dark:bg-rose-950/30 text-rose-600 rounded-lg">
              <TrendingDown size={18} />
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{t.worstMargin}</h3>
          </div>
          <div className="space-y-3">
            {businessInsights?.worstMarginProducts?.map((item: any, index: number) => (
              <div key={item.productId} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.productName}</span>
                </div>
                <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                  {item.marginPercent.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-2xl border border-orange-100 dark:border-orange-900/30 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-lg">
            <BrainCircuit size={18} />
          </div>
          <h3 className="font-bold text-lg text-orange-900 dark:text-orange-300">{t.quickWins}</h3>
        </div>
        <div className="space-y-2">
          {businessInsights?.worstMarginProducts?.[0] && (
            <p className="text-sm text-orange-800 dark:text-orange-300">
              • {lang === 'en' ? 'Consider raising prices on' : 'Rekebisha bei ya'} <span className="font-bold">{businessInsights.worstMarginProducts[0].productName}</span> {lang === 'en' ? 'to improve margins' : 'kuboresha faida'}
            </p>
          )}
          {inventoryHealth?.lowStock?.length > 0 && (
            <p className="text-sm text-orange-800 dark:text-orange-300">
              • {lang === 'en' ? 'Restock' : 'Ongeza stock ya'} <span className="font-bold">{inventoryHealth.lowStock[0].productName}</span> {lang === 'en' ? 'to prevent lost sales' : 'kuzuia mauzo kushuka'}
            </p>
          )}
          {deadStock.length > 0 && (
            <p className="text-sm text-orange-800 dark:text-orange-300">
              • {lang === 'en' ? 'Run promotion on' : 'Fanya ubongo kwa'} <span className="font-bold">{deadStock[0].productName}</span> {lang === 'en' ? 'to move dead stock' : 'kuzungusha bidhaa zilizolala'}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner size={60} thickness={180} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-slate-50 dark:bg-slate-950 relative transition-colors duration-300">
      <div className="pt-8 px-8 pb-4 shrink-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-gradient-brand rounded-xl shadow-lg shadow-orange-200 dark:shadow-none">
              <BrainCircuit size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">{t.analysis}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {lang === 'en' ? 'Business intelligence & insights' : 'Maarifa na ufahamu wa biashara'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 pb-4 shrink-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 w-fit">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                    activeTab === tab.id
                      ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{t.selectPeriod}:</span>
            <div className="flex gap-2">
              {(['week', 'month', '3months', '6months'] as PeriodType[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                    period === p
                      ? "bg-brand-primary text-white"
                      : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-brand-primary/30"
                  )}
                >
                  {p === 'week' ? t.week : p === 'month' ? t.month : p === '3months' ? t.threeMonths : t.sixMonths}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-4 px-8 pb-8 no-scrollbar">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'sales' && renderSalesTab()}
              {activeTab === 'deadstock' && renderDeadStockTab()}
              {activeTab === 'profitability' && renderProfitabilityTab()}
              {activeTab === 'inventory' && renderInventoryTab()}
              {activeTab === 'insights' && renderInsightsTab()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}