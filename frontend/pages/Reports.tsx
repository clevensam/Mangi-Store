import React, { useState, useMemo } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useQuery, gql } from '@apollo/client';
import { translations, type Language } from '../lib/i18n';
import { formatCurrency, cn } from '../lib/utils';
import { Calculator, Search, Calendar, ChevronDown, DollarSign, Package, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SALES_REPORT = gql`
  query SalesReport($startDate: String!, $endDate: String!) {
    salesReport(startDate: $startDate, endDate: $endDate) {
      items {
        productId
        productName
        totalQuantity
        totalRevenue
        totalCost
        totalProfit
      }
      summary {
        totalRevenue
        totalQuantity
        totalProfit
      }
    }
  }
`;

type PeriodType = 'today' | 'custom' | 'week' | 'month' | '3months' | '6months';

const QUICK_OPTIONS: { value: PeriodType; labelKey: 'today' | 'date' }[] = [
  { value: 'today', labelKey: 'today' },
  { value: 'custom', labelKey: 'date' },
];

const PERIOD_DROPDOWN_OPTIONS: { value: PeriodType; labelKey: 'week' | 'month' | 'threeMonths' | 'sixMonths' }[] = [
  { value: 'week', labelKey: 'week' },
  { value: 'month', labelKey: 'month' },
  { value: '3months', labelKey: 'threeMonths' },
  { value: '6months', labelKey: 'sixMonths' },
];

export default function ReportsPage({ lang }: { lang: Language }) {
  const t = translations[lang];
  const [period, setPeriod] = useState<PeriodType>('3months');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');

  const dateRange = useMemo(() => {
    let start: Date;
    let end: Date = new Date();

    switch (period) {
      case 'today':
        start = new Date();
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start = new Date();
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start = new Date();
        start.setDate(start.getDate() - 30);
        break;
      case '3months':
        start = new Date();
        start.setDate(start.getDate() - 90);
        break;
      case '6months':
        start = new Date();
        start.setDate(start.getDate() - 180);
        break;
      case 'custom':
        start = new Date(selectedDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(selectedDate);
        end.setHours(23, 59, 59, 999);
        break;
      default:
        start = new Date();
        start.setDate(start.getDate() - 90);
    }

    return { start, end };
  }, [period, selectedDate]);

  const { loading, data } = useQuery(SALES_REPORT, {
    variables: {
      startDate: dateRange.start.toISOString(),
      endDate: dateRange.end.toISOString(),
    },
  });

  const reportItems = data?.salesReport?.items ?? [];
  const reportSummary = data?.salesReport?.summary;

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return reportItems;
    const query = searchTerm.toLowerCase();
    return reportItems.filter((item: any) =>
      item.productName.toLowerCase().includes(query)
    );
  }, [reportItems, searchTerm]);

  const totals = useMemo(() => {
    if (!searchTerm.trim() && reportSummary) {
      return {
        totalRevenue: reportSummary.totalRevenue,
        totalQuantity: reportSummary.totalQuantity,
        totalProfit: reportSummary.totalProfit,
      };
    }
    return filteredProducts.reduce(
      (acc: any, item: any) => ({
        totalRevenue: acc.totalRevenue + item.totalRevenue,
        totalQuantity: acc.totalQuantity + item.totalQuantity,
        totalProfit: acc.totalProfit + item.totalProfit,
      }),
      { totalRevenue: 0, totalQuantity: 0, totalProfit: 0 },
    );
  }, [filteredProducts, reportSummary, searchTerm]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative transition-colors duration-300">
      <div className="pt-8 px-8 pb-4 shrink-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-gradient-brand rounded-xl shadow-lg shadow-orange-200 dark:shadow-none">
              <Calculator size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">{t.hesabu}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track your sales and profits</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 pb-4 shrink-0">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-lg">
                <DollarSign size={18} />
              </div>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t.totalSales}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{formatCurrency(totals.totalRevenue)}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/30 text-blue-600 rounded-lg">
                <Package size={18} />
              </div>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t.totalSold}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{totals.totalQuantity.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-orange-50 dark:bg-orange-950/30 text-brand-primary rounded-lg">
                <TrendingUp size={18} />
              </div>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t.netProfit}</p>
            <p className={`text-2xl font-bold mt-1 ${totals.totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(totals.totalProfit)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-4 px-8 pb-8 no-scrollbar">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            <div className="p-6 border-b border-slate-50 dark:border-slate-800">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    placeholder={t.searchProductName}
                    className="w-full h-11 pl-11 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:bg-white dark:focus:bg-slate-750 focus:border-brand-primary/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:text-slate-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {QUICK_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setPeriod(opt.value)}
                      className={cn(
                        "px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all",
                        period === opt.value
                          ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                      )}
                    >
                      {t[opt.labelKey]}
                    </button>
                  ))}
                  
                  <div className="relative">
                    <select
                      value={PERIOD_DROPDOWN_OPTIONS.some(o => o.value === period) ? period : ''}
                      onChange={(e) => {
                        if (e.target.value) setPeriod(e.target.value as PeriodType);
                      }}
                      className="appearance-none pl-4 pr-10 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 cursor-pointer"
                    >
                      {!PERIOD_DROPDOWN_OPTIONS.some(o => o.value === period) && (
                        <option value="" disabled>
                          {period === 'today' ? t.today : t.date}
                        </option>
                      )}
                      {PERIOD_DROPDOWN_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{t[opt.labelKey]}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {period === 'custom' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="relative max-w-[200px]">
                        <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary/20 text-slate-700 dark:text-slate-300"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-50 dark:border-slate-800">
                    <th className="py-6 px-8 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">#</th>
                    <th className="py-6 px-6 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t.product}</th>
                    <th className="py-6 px-6 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">{t.quantity}</th>
                    <th className="py-6 px-8 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">{t.revenue}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-16 text-center text-slate-400 dark:text-slate-500">
                        {t.noSalesFound}
                      </td>
                    </tr>
                  ) : (
                    <AnimatePresence mode="popLayout">
                      {filteredProducts.map((item: any, index: number) => (
                        <motion.tr
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          key={item.productId}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="py-6 px-8">
                            <span className="text-sm font-semibold text-slate-400">{index + 1}</span>
                          </td>
                          <td className="py-6 px-6">
                            <span className="font-bold text-slate-900 dark:text-slate-100">{item.productName}</span>
                          </td>
                          <td className="py-6 px-6 text-right font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                            {item.totalQuantity.toLocaleString()}
                          </td>
                          <td className="py-6 px-8 text-right font-black text-brand-primary tabular-nums">
                            {formatCurrency(item.totalRevenue)}
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  )}
                </tbody>
                {filteredProducts.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-50 dark:bg-slate-800/50">
                      <td className="py-6 px-8 text-[11px] font-black text-slate-500 uppercase tracking-wider" colSpan={2}>{t.grandTotal}</td>
                      <td className="py-6 px-6 text-right text-sm font-bold text-slate-700 dark:text-slate-200 tabular-nums">{totals.totalQuantity.toLocaleString()}</td>
                      <td className="py-6 px-8 text-right text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">{formatCurrency(totals.totalRevenue)}</td>
                    </tr>
                    <tr className="border-t border-slate-100 dark:border-slate-800">
                      <td className="py-6 px-8 text-[11px] font-black text-green-600 dark:text-green-400 uppercase tracking-wider" colSpan={3}>{t.netProfit}</td>
                      <td className={`py-6 px-8 text-right text-sm font-bold tabular-nums ${totals.totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(totals.totalProfit)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}