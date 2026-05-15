import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { toast } from 'sonner';
import { translations, type Language } from '../lib/i18n';
import { formatCurrency, cn } from '../lib/utils';
import { Plus, Package, X, ArrowUpCircle, Search, ArrowUpDown, Edit2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const GET_PRODUCTS = gql`
  query GetProducts {
    products {
      id
      name
      category
      buying_price
      selling_price
      quantity
      low_stock_threshold
    }
  }
`;

const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: ID!, $name: String, $category: String, $buying_price: Float, $selling_price: Float, $quantity: Int, $low_stock_threshold: Int) {
    updateProduct(id: $id, name: $name, category: $category, buying_price: $buying_price, selling_price: $selling_price, quantity: $quantity, low_stock_threshold: $low_stock_threshold) {
      id
      name
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

interface Props {
  lang: Language;
  onViewDetails?: (id: string) => void;
}

const CATEGORIES = ['all', 'drinks', 'groceries', 'electronics', 'clothing', 'others'] as const;
type CategoryType = typeof CATEGORIES[number];

export default function StockPage({ lang, onViewDetails }: Props) {
  const t = translations[lang];
  const [showRestock, setShowRestock] = useState(false);
  const [restockId, setRestockId] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState<number>(0);
  
  // Edit state
  const [showEdit, setShowEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: 'groceries',
    buying_price: 0,
    selling_price: 0,
    quantity: 0,
    low_stock_threshold: 5
  });
  
  // Table state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryType | 'all'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product; direction: 'asc' | 'desc' } | null>(null);

  const { loading, data, refetch } = useQuery(GET_PRODUCTS);
  const [updateProduct] = useMutation(UPDATE_PRODUCT);

  const products = data?.products as Product[] || [];

  const handleRestock = (p: Product) => {
    setRestockId(p.id);
    setRestockQty(0);
    setShowRestock(true);
  };

  const handleEdit = (p: Product) => {
    setFormData({
      name: p.name,
      category: p.category,
      buying_price: p.buying_price,
      selling_price: p.selling_price,
      quantity: p.quantity,
      low_stock_threshold: p.low_stock_threshold
    });
    setEditingId(p.id);
    setShowEdit(true);
  };

  const handleSaveProduct = async () => {
    if (!editingId || !formData.name) return;
    try {
      await updateProduct({
        variables: {
          id: editingId,
          name: formData.name,
          category: formData.category,
          buying_price: formData.buying_price,
          selling_price: formData.selling_price,
          quantity: formData.quantity,
          low_stock_threshold: formData.low_stock_threshold
        }
      });

      toast.success('Product updated successfully');
      setShowEdit(false);
      setEditingId(null);
      refetch();
    } catch (err: any) {
      toast.error('Failed to update product');
    }
  };

  const confirmRestock = async () => {
    if (!restockId || restockQty <= 0) return;
    
    const product = products.find(p => p.id === restockId);
    if (product) {
      try {
        await updateProduct({
          variables: {
            id: restockId,
            quantity: product.quantity + restockQty
          }
        });

        toast.success(`Restocked ${restockQty} units of ${product.name}`);
        refetch();
      } catch (err) {
        toast.error('Restock failed');
      }
    }

    setShowRestock(false);
    setRestockId(null);
    setRestockQty(0);
  };

  const handleSort = (key: keyof Product) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedProducts = useMemo(() => {
    if (!products) return [];

    let result = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || p.category.toLowerCase() === categoryFilter.toLowerCase();
      return matchesSearch && matchesCategory;
    });

    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key] ?? '';
        const bValue = b[sortConfig.key] ?? '';

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [products, searchTerm, categoryFilter, sortConfig]);

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
            {/* Table Toolbar */}
            <div className="p-4 sm:p-6 border-b border-slate-50 dark:border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 flex-1">
                <div className="relative flex-1 w-full sm:max-w-sm group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" size={18} />
                  <input
                    type="text"
                    placeholder={t.searchInventory}
                    className="w-full h-11 pl-11 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:bg-white dark:focus:bg-slate-750 focus:border-brand-primary/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:text-slate-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-slate-700 overflow-x-auto no-scrollbar shrink-0 max-w-full">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={cn(
                        "px-3 sm:px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                        categoryFilter === cat 
                          ? "bg-white dark:bg-slate-700 text-brand-primary shadow-sm ring-1 ring-slate-100 dark:ring-slate-600" 
                          : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      )}
                    >
                      {t[cat as keyof typeof t] || cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop Table - hidden on mobile */}
            <div className="hidden sm:block overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-50 dark:border-slate-800">
                    <th onClick={() => handleSort('name')} className="py-4 sm:py-6 px-4 sm:px-8 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        {t.products} <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th onClick={() => handleSort('category')} className="py-4 sm:py-6 px-4 sm:px-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        {t.category} <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th onClick={() => handleSort('quantity')} className="py-4 sm:py-6 px-4 sm:px-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-center">
                      <div className="flex items-center justify-center gap-2 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">
                        {t.stock} <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th onClick={() => handleSort('selling_price')} className="py-4 sm:py-6 px-4 sm:px-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-right">
                      <div className="flex items-center justify-end gap-2 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">
                        {lang === 'en' ? 'Price' : 'Bei'} <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th className="py-4 sm:py-6 px-4 sm:px-8 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">{t.action}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {filteredAndSortedProducts.map((product) => {
                    const isLow = product.quantity <= product.low_stock_threshold;
                    return (
                      <tr 
                        key={product.id} 
                        onClick={() => onViewDetails?.(product.id)}
                        className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                      >
                        <td className="py-4 sm:py-5 px-4 sm:px-8">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className={cn(
                              "h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all border",
                              isLow ? "bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900 text-rose-500 dark:text-rose-400" : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500"
                            )}>
                               <Package size={20} />
                            </div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">{product.name}</span>
                          </div>
                        </td>
                        <td className="py-4 sm:py-5 px-4 sm:px-6">
                           <span className={cn(
                             "px-3 sm:px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 ring-1 ring-inset ring-slate-100 dark:ring-slate-700"
                           )}>
                             {t[product.category as keyof typeof t] || product.category}
                           </span>
                        </td>
                        <td className="py-4 sm:py-5 px-4 sm:px-6 text-center">
                          <div className="flex flex-col items-center gap-1">
                             <span className={cn(
                               "font-black text-base sm:text-lg tabular-nums",
                               isLow ? "text-rose-500 dark:text-rose-400" : "text-slate-900 dark:text-slate-100"
                             )}>
                               {product.quantity}
                             </span>
                             {isLow && (
                               <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/30 text-rose-500 dark:text-rose-400 rounded text-[8px] font-black uppercase tracking-widest border border-rose-100 dark:border-rose-900">Low</span>
                             )}
                          </div>
                        </td>
                        <td className="py-4 sm:py-5 px-4 sm:px-6 text-right font-black text-slate-900 dark:text-slate-100 tabular-nums">
                          {formatCurrency(product.selling_price)}
                        </td>
                        <td className="py-4 sm:py-5 px-4 sm:px-8">
                          <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                             <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRestock(product);
                                }} 
                                className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all shadow-sm shadow-slate-200/50"
                                title="Add Stock"
                              >
                                <Plus size={18} />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(product);
                                }} 
                                className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-400 hover:text-brand-primary dark:hover:text-brand-secondary hover:border-brand-primary/30 transition-all shadow-sm shadow-slate-200/50"
                              >
                                <Edit2 size={16} />
                              </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-slate-50 dark:divide-slate-800">
              {filteredAndSortedProducts.map((product) => {
                const isLow = product.quantity <= product.low_stock_threshold;
                return (
                  <div
                    key={product.id}
                    onClick={() => onViewDetails?.(product.id)}
                    className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center border shrink-0",
                        isLow ? "bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900 text-rose-500 dark:text-rose-400" : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500"
                      )}>
                        <Package size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">{product.name}</p>
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          {t[product.category as keyof typeof t] || product.category}
                        </p>
                      </div>
                      <span className="font-black text-slate-900 dark:text-slate-100 tabular-nums text-sm">
                        {formatCurrency(product.selling_price)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-black text-lg tabular-nums",
                          isLow ? "text-rose-500 dark:text-rose-400" : "text-slate-900 dark:text-slate-100"
                        )}>
                          {product.quantity}
                        </span>
                        {isLow && (
                          <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/30 text-rose-500 dark:text-rose-400 rounded text-[8px] font-black uppercase tracking-widest border border-rose-100 dark:border-rose-900">Low</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRestock(product); }}
                          className="h-9 w-9 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-400 hover:text-emerald-500 transition-all"
                        >
                          <Plus size={16} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(product); }}
                          className="h-9 w-9 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-400 hover:text-brand-primary transition-all"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Placeholder */}
            <div className="p-4 sm:p-6 border-t border-slate-50 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-800/10 flex flex-wrap justify-center sm:justify-end gap-2">
               <button className="px-3 sm:px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 cursor-not-allowed">Previous</button>
               <button className="h-8 w-8 flex items-center justify-center rounded-lg bg-brand-primary text-white text-xs font-black shadow-md shadow-orange-100 dark:shadow-none">1</button>
               <button className="h-8 w-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">2</button>
               <button className="px-3 sm:px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-300 hover:text-brand-primary transition-colors">Next</button>
            </div>
            {/* No Products Found State */}
            {filteredAndSortedProducts.length === 0 && (
              <div className="p-12 sm:p-32 text-center bg-white dark:bg-slate-900">
                <div className="inline-flex p-6 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-300 dark:text-slate-700 mb-4">
                  <Search size={36} />
                </div>
                <p className="text-slate-400 dark:text-slate-500 font-bold text-base sm:text-lg">No products found matching your criteria</p>
                <button onClick={() => { setSearchTerm(''); setCategoryFilter('all'); }} className="mt-4 text-brand-primary font-bold hover:underline font-black uppercase tracking-widest text-xs">
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showRestock && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowRestock(false)} className="fixed inset-0 bg-slate-900/10 backdrop-blur-md z-[60]" />
            <div className="fixed inset-0 z-[70] overflow-y-auto pointer-events-none flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="pointer-events-auto w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2rem] p-6 space-y-6 shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-800"
              >
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">{t.restock}</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{t.addUnitsToInventory}</p>
                  </div>
                  <button onClick={() => setShowRestock(false)} className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-xl text-slate-400 hover:text-brand-primary transition-all"><X size={18} /></button>
                </div>

                <div className="space-y-6">
                  <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{t.products}</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{products?.find(p => p.id === restockId)?.name}</p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block text-left">{t.quantityReceived}</label>
                    <div className="flex items-center gap-4 justify-center bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <button onClick={() => setRestockQty(Math.max(0, restockQty - 1))} className="w-10 h-10 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:border-brand-primary hover:text-brand-primary transition-all active:scale-95 shadow-sm">-</button>
                      <input 
                        type="number" 
                        className="w-20 bg-transparent border-none text-center text-3xl font-black text-slate-900 dark:text-slate-100 focus:ring-0 tabular-nums" 
                        value={restockQty} 
                        onChange={e => setRestockQty(Number(e.target.value))}
                      />
                      <button onClick={() => setRestockQty(restockQty + 1)} className="w-10 h-10 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold hover:bg-brand-primary transition-all active:scale-95 shadow-lg shadow-slate-200 dark:shadow-none">+</button>
                    </div>
                  </div>

                  <button 
                    onClick={confirmRestock}
                    className="w-full h-12 bg-brand-primary text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-orange-100 dark:shadow-none hover:bg-brand-secondary active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <ArrowUpCircle size={18} />
                    {t.confirmArrival}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEdit && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEdit(false)} className="fixed inset-0 bg-slate-900/10 backdrop-blur-md z-[60]" />
            <div className="fixed inset-0 z-[70] overflow-y-auto pointer-events-none flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="pointer-events-auto w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] p-6 space-y-5 shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="flex justify-between items-center shrink-0">
                  <div className="space-y-0.5">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">{t.editProduct}</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{t.updateInventoryDetails}</p>
                  </div>
                  <button onClick={() => setShowEdit(false)} className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-xl text-slate-400 hover:text-brand-primary transition-all"><X size={18} /></button>
                </div>

                <div className="space-y-4 overflow-y-auto pr-1 pb-1 no-scrollbar">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Product Name</label>
                    <input 
                      type="text" 
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/20 transition-all font-bold text-slate-800 dark:text-slate-100 text-sm placeholder:text-slate-400" 
                      value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t.buyingPrice}</label>
                      <input 
                        type="number" 
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/20 font-bold text-slate-800 dark:text-slate-100 text-sm" 
                        value={formData.buying_price} onChange={e => setFormData({...formData, buying_price: Number(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t.sellingPrice}</label>
                      <input 
                        type="number" 
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/20 font-bold text-slate-800 dark:text-slate-100 text-sm" 
                        value={formData.selling_price} onChange={e => setFormData({...formData, selling_price: Number(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t.stockLevel}</label>
                      <input 
                        type="number" 
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/20 font-bold text-slate-800 dark:text-slate-100 text-sm" 
                        value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t.alertLevel}</label>
                      <input 
                        type="number" 
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/20 font-bold text-slate-800 dark:text-slate-100 text-sm" 
                        value={formData.low_stock_threshold} onChange={e => setFormData({...formData, low_stock_threshold: Number(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t.category}</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {CATEGORIES.filter(c => c !== 'all').map(c => (
                        <button
                          key={c}
                          onClick={() => setFormData({...formData, category: c})}
                          className={cn(
                            "px-3 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border",
                            formData.category === c 
                              ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-lg shadow-slate-200 dark:shadow-none" 
                              : "bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600"
                          )}
                        >
                          {t[c as keyof typeof t]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    onClick={handleSaveProduct}
                    className="w-full h-12 bg-brand-primary text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-orange-100 hover:bg-brand-secondary active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    <Save size={16} />
                    {t.updateProduct}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

