import React from 'react';
import { Package, Search, ArrowUpDown, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';
import LoadingSpinner from '../../components/LoadingSpinner';

interface Product {
  id: string;
  name: string;
  category: string;
  buying_price: number;
  selling_price: number;
  quantity: number;
  low_stock_threshold: number;
}

const CATEGORIES = ['all', 'beer', 'spirits', 'soft_drinks', 'water'] as const;

interface StockPresenterProps {
  t: Record<string, string>;
  products: Product[];
  filteredProducts: Product[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  onSearchChange: (v: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (v: string) => void;
  sortConfig: { key: keyof Product; direction: 'asc' | 'desc' } | null;
  onSort: (key: keyof Product) => void;
  onRefresh: () => void;
}

export function StockPresenter({
  t, filteredProducts, searchTerm, onSearchChange,
  categoryFilter, onCategoryFilterChange, sortConfig, onSort,
  loading, error, onRefresh,
}: StockPresenterProps) {
  if (loading) {
    return <div className="flex-1 flex items-center justify-center p-8"><LoadingSpinner /></div>;
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative transition-colors duration-300">
      <div className="pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8 pb-0 shrink-0">
        <div className="w-full">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{t.stock}</h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">{t.manageInventory}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto pt-4 px-4 sm:px-6 lg:px-8 pb-8 no-scrollbar">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8 pb-32">
          <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            <div className="p-4 sm:p-6 border-b border-slate-50 dark:border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 flex-1">
                <div className="relative flex-1 w-full sm:max-w-sm group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" size={18} />
                  <input type="text" placeholder={t.searchInventory} className="w-full h-11 pl-11 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:bg-white dark:focus:bg-slate-750 focus:border-brand-primary/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:text-slate-200" value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} />
                </div>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-slate-700 overflow-x-auto no-scrollbar shrink-0 max-w-full">
                  {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => onCategoryFilterChange(cat)} className={cn("px-3 sm:px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap", categoryFilter === cat ? "bg-white dark:bg-slate-700 text-brand-primary shadow-sm ring-1 ring-slate-100 dark:ring-slate-600" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300")}>
                      {t[cat as keyof typeof t] || cat}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={onRefresh} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-brand-primary transition-colors" title="Refresh">
                <RefreshCw size={16} />
              </button>
            </div>

            {error && (
              <div className="px-4 sm:px-8 py-3 bg-rose-50 dark:bg-rose-950/20 text-rose-500 text-xs font-bold">
                {error}
              </div>
            )}

            <div className="hidden sm:block overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-50 dark:border-slate-800">
                    <th onClick={() => onSort('name')} className="py-4 sm:py-6 px-4 sm:px-8 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.products} <ArrowUpDown size={12} /></div>
                    </th>
                    <th onClick={() => onSort('category')} className="py-4 sm:py-6 px-4 sm:px-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.category} <ArrowUpDown size={12} /></div>
                    </th>
                    <th onClick={() => onSort('quantity')} className="py-4 sm:py-6 px-4 sm:px-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-center">
                      <div className="flex items-center justify-center gap-2 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.stock} <ArrowUpDown size={12} /></div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {filteredProducts.map((product) => {
                    const isLow = product.quantity <= product.low_stock_threshold;
                    return (
                      <tr key={product.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 sm:py-5 px-4 sm:px-8">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className={cn("h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all border", isLow ? "bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900 text-rose-500 dark:text-rose-400" : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500")}>
                              <Package size={20} />
                            </div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">{product.name}</span>
                          </div>
                        </td>
                        <td className="py-4 sm:py-5 px-4 sm:px-6">
                          <span className="px-3 sm:px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 ring-1 ring-inset ring-slate-100 dark:ring-slate-700">
                            {t[product.category as keyof typeof t] || product.category}
                          </span>
                        </td>
                        <td className="py-4 sm:py-5 px-4 sm:px-6 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={cn("font-black text-base sm:text-lg tabular-nums", isLow ? "text-rose-500 dark:text-rose-400" : "text-slate-900 dark:text-slate-100")}>{product.quantity}</span>
                            {isLow && <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/30 text-rose-500 dark:text-rose-400 rounded text-[8px] font-black uppercase tracking-widest border border-rose-100 dark:border-rose-900">Low</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="sm:hidden divide-y divide-slate-50 dark:divide-slate-800">
              {filteredProducts.map((product) => {
                const isLow = product.quantity <= product.low_stock_threshold;
                return (
                  <div key={product.id} className="p-4 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center border shrink-0", isLow ? "bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900 text-rose-500 dark:text-rose-400" : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500")}>
                        <Package size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">{product.name}</p>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t[product.category as keyof typeof t] || product.category}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn("font-black text-lg tabular-nums", isLow ? "text-rose-500 dark:text-rose-400" : "text-slate-900 dark:text-slate-100")}>{product.quantity}</span>
                        {isLow && <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/30 text-rose-500 dark:text-rose-400 rounded text-[8px] font-black uppercase tracking-widest border border-rose-100 dark:border-rose-900">Low</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredProducts.length === 0 && (
              <div className="p-12 sm:p-32 text-center bg-white dark:bg-slate-900">
                <div className="inline-flex p-6 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-300 dark:text-slate-700 mb-4"><Search size={36} /></div>
                <p className="text-slate-400 dark:text-slate-500 font-bold text-base sm:text-lg">No products found matching your criteria</p>
                <button onClick={() => { onSearchChange(''); onCategoryFilterChange('all'); }} className="mt-4 text-brand-primary font-bold hover:underline font-black uppercase tracking-widest text-xs">Clear all filters</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
