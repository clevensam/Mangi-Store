import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { toast } from 'sonner';
import { translations, type Language } from '../lib/i18n';
import { formatCurrency, cn } from '../lib/utils';
import { Search, Plus, Minus, CheckCircle, X, ShoppingCart, LayoutGrid, List, ShoppingBag, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const GET_PRODUCTS = gql`
  query GetProducts {
    products {
      id
      name
      category
      selling_price
      quantity
    }
  }
`;

const RECORD_SALE = gql`
  mutation RecordSale($productId: ID!, $quantity: Int!, $totalPrice: Float!) {
    recordSale(productId: $productId, quantity: $quantity, totalPrice: $totalPrice) {
      id
    }
  }
`;

const CATEGORIES = ['all', 'drinks', 'groceries', 'electronics', 'clothing', 'others'] as const;
type CategoryType = typeof CATEGORIES[number];

interface Product {
  id: string;
  name: string;
  category: string;
  selling_price: number;
  quantity: number;
}

interface Props {
  lang: Language;
}

export default function SalesPage({ lang }: Props) {
  const t = translations[lang];
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryType | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);

  const { loading, data, refetch } = useQuery(GET_PRODUCTS);
  const [recordSale] = useMutation(RECORD_SALE);

  const products = data?.products as Product[] || [];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const handleSale = async () => {
    if (!selectedProduct) return;

    if (qty > selectedProduct.quantity) {
      toast.error(lang === 'en' 
        ? `Insufficient stock. Only ${selectedProduct.quantity} available`
        : `Haina kutosha. Kuna ${selectedProduct.quantity} peke yake`);
      return;
    }

    const total = selectedProduct.selling_price * qty;

    try {
      await recordSale({
        variables: {
          productId: selectedProduct.id,
          quantity: qty,
          totalPrice: total
        }
      });

      setSelectedProduct(null);
      setQty(1);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);

      toast.success(lang === 'en' ? 'Sale recorded successfully' : 'Mauzo yamefanikiwa', {
        description: lang === 'en' ? `Sold ${qty}x ${selectedProduct.name} for ${formatCurrency(total)}` : `Umeuza ${qty}x ${selectedProduct.name} kwa ${formatCurrency(total)}`,
        icon: <CheckCircle size={18} className="text-emerald-500" />
      });
      refetch();
    } catch (err: any) {
      const message = err?.message || 'Sale recording failed';
      toast.error(message);
    }
  };

  const isOutOfStock = selectedProduct?.quantity === 0;
  const isInsufficientStock = qty > (selectedProduct?.quantity || 0);
  const canConfirm = selectedProduct && qty <= selectedProduct.quantity && qty > 0 && !isOutOfStock;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative transition-colors duration-300">
      {/* Header Section */}
      <div className="pt-8 px-8 pb-0 shrink-0">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{t.sales}</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">{lang === 'en' ? 'Select a product to record a quick sale.' : 'Chagua bidhaa iliurekodi mauzo ya haraka.'}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto pt-4 px-8 pb-32 no-scrollbar">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
              {/* Toolbar */}
              <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div className="flex flex-col md:flex-row items-center gap-4 flex-1">
                  <div className="relative flex-1 w-full md:max-w-sm group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" size={18} />
                    <input
                      type="text"
                      placeholder={t.searchProducts}
                      className="w-full h-11 pl-11 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:bg-white dark:focus:bg-slate-750 focus:border-brand-primary/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:text-slate-200"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar shrink-0 max-w-full">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={cn(
                          "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
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

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        viewMode === 'grid' ? "bg-white dark:bg-slate-700 text-brand-primary shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      )}
                    >
                      <LayoutGrid size={18} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        viewMode === 'list' ? "bg-white dark:bg-slate-700 text-brand-primary shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      )}
                    >
                      <List size={18} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Product Display */}
              <div className="p-6">
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="h-8 w-8 border-3 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredProducts.map((product) => {
                      const isZeroStock = product.quantity === 0;
                      const isLowStock = product.quantity > 0 && product.quantity <= 5;
                      const iconBgClass = isZeroStock
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600"
                        : isLowStock
                          ? "bg-amber-50 dark:bg-amber-950/30 text-amber-500 dark:text-amber-400"
                          : "bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-orange-50 dark:group-hover:bg-orange-950/30 group-hover:text-brand-primary";

                      return (
                        <button
                          key={product.id}
                          onClick={() => !isZeroStock && setSelectedProduct(product)}
                          disabled={isZeroStock}
                          className={cn(
                            "group relative bg-white dark:bg-slate-800/50 border rounded-[2rem] p-6 text-left transition-all active:scale-[0.98]",
                            isZeroStock
                              ? "border-slate-100 dark:border-slate-800 opacity-50 cursor-not-allowed"
                              : "border-slate-100 dark:border-slate-800 hover:border-brand-primary/30 dark:hover:border-brand-primary/50 hover:shadow-xl hover:shadow-orange-900/5 dark:hover:shadow-orange-950/20 cursor-pointer"
                          )}
                        >
                          {isZeroStock && (
                            <div className="absolute top-4 right-4 px-2 py-1 bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                              <AlertTriangle size={10} />
                              Out of Stock
                            </div>
                          )}
                          <div className="flex flex-col gap-4">
                            <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center transition-all", iconBgClass)}>
                              <ShoppingBag size={28} />
                            </div>
                            <div>
                              <p className={cn(
                                "font-black text-lg leading-tight truncate",
                                isZeroStock ? "text-slate-400 dark:text-slate-600" : "text-slate-800 dark:text-slate-100"
                              )}>
                                {product.name}
                              </p>
                              <p className={cn(
                                "text-[10px] font-black uppercase tracking-widest mt-1",
                                isZeroStock
                                  ? "text-slate-300 dark:text-slate-600"
                                  : isLowStock
                                    ? "text-amber-500 dark:text-amber-400"
                                    : "text-slate-400 dark:text-slate-500"
                              )}>
                                {t[product.category as keyof typeof t] || product.category}
                                {isZeroStock ? ' • Out of stock' : ` • ${product.quantity} ${lang === 'en' ? 'in stock' : 'zipo'}`}
                              </p>
                            </div>
                            <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                              <span className={cn(
                                "text-sm font-black uppercase tracking-widest",
                                isZeroStock ? "text-slate-300 dark:text-slate-600" : "text-slate-400 dark:text-slate-500"
                              )}>
                                {lang === 'en' ? 'Price' : 'Bei'}
                              </span>
                              <span className={cn(
                                "font-bold text-xl tabular-nums",
                                isZeroStock
                                  ? "text-slate-300 dark:text-slate-600"
                                  : "text-brand-primary"
                              )}>
                                {formatCurrency(product.selling_price)}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="overflow-x-auto no-scrollbar -mx-6">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-50 dark:border-slate-800">
                          <th className="py-4 px-8 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.products}</th>
                          <th className="py-4 px-6 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">{t.stock}</th>
                          <th className="py-4 px-6 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">{lang === 'en' ? 'Price' : 'Bei'}</th>
                          <th className="py-4 px-8 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">{t.action}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {filteredProducts.map((product) => {
                          const isZeroStock = product.quantity === 0;

                          return (
                            <tr
                              key={product.id}
                              onClick={() => !isZeroStock && setSelectedProduct(product)}
                              className={cn(
                                "group transition-colors",
                                isZeroStock
                                  ? "opacity-50 cursor-not-allowed"
                                  : "hover:bg-slate-50/50 dark:hover:bg-slate-800/30 cursor-pointer"
                              )}
                            >
                              <td className="py-4 px-8">
                                <div className="flex items-center gap-4">
                                  <div className={cn(
                                    "h-10 w-10 rounded-xl flex items-center justify-center transition-colors border",
                                    isZeroStock
                                      ? "bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-slate-100 dark:border-slate-700"
                                      : "bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700 group-hover:bg-orange-50 dark:group-hover:bg-orange-950/30 group-hover:text-brand-primary"
                                  )}>
                                    <ShoppingBag size={18} />
                                  </div>
                                  <div>
                                    <span className={cn(
                                      "font-bold",
                                      isZeroStock ? "text-slate-400 dark:text-slate-600" : "text-slate-900 dark:text-slate-100"
                                    )}>
                                      {product.name}
                                    </span>
                                    {isZeroStock && (
                                      <span className="ml-2 px-2 py-0.5 bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded text-[9px] font-black uppercase tracking-widest">
                                        Out of Stock
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className={cn(
                                "py-4 px-6 text-right font-bold tabular-nums",
                                isZeroStock
                                  ? "text-slate-300 dark:text-slate-600"
                                  : product.quantity <= 5
                                    ? "text-amber-500 dark:text-amber-400"
                                    : "text-slate-400 dark:text-slate-500"
                              )}>
                                {product.quantity}
                              </td>
                              <td className={cn(
                                "py-4 px-6 text-right font-black tabular-nums",
                                isZeroStock ? "text-slate-300 dark:text-slate-600" : "text-slate-900 dark:text-slate-100"
                              )}>
                                {formatCurrency(product.selling_price)}
                              </td>
                              <td className="py-4 px-8 text-right">
                                <button
                                  disabled={isZeroStock}
                                  className={cn(
                                    "h-10 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95",
                                    isZeroStock
                                      ? "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                                      : "bg-brand-primary text-white shadow-orange-100 hover:bg-orange-600"
                                  )}
                                >
                                  {isZeroStock ? 'Out of Stock' : 'Record Sale'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {filteredProducts.length === 0 && !loading && (
                  <div className="py-20 text-center">
                    <div className="inline-flex p-6 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-200 dark:text-slate-700 mb-4">
                      <Search size={48} />
                    </div>
                    <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-xs">No products found matching your search</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Add Item Modal */}
      <AnimatePresence>
        {selectedProduct && !showSuccess && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedProduct(null)} className="fixed inset-0 bg-slate-900/10 backdrop-blur-md z-40" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 m-auto w-full max-w-md h-fit bg-white dark:bg-slate-900 rounded-[2rem] p-6 z-50 space-y-6 shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-800"
            >
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight">{selectedProduct.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      {t[selectedProduct.category as keyof typeof t] || selectedProduct.category}
                    </span>
                    <p className="text-xs font-bold text-brand-primary uppercase tracking-widest">{formatCurrency(selectedProduct.selling_price)} / unit</p>
                  </div>
                </div>
                <button onClick={() => setSelectedProduct(null)} className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Stock Info */}
              <div className={cn(
                "flex items-center justify-between px-4 py-3 rounded-xl border",
                isOutOfStock
                  ? "bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900"
                  : isInsufficientStock
                    ? "bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900"
                    : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900"
              )}>
                <div className="flex items-center gap-2">
                  {isOutOfStock ? (
                    <AlertTriangle size={16} className="text-rose-500 dark:text-rose-400" />
                  ) : isInsufficientStock ? (
                    <AlertTriangle size={16} className="text-amber-500 dark:text-amber-400" />
                  ) : (
                    <CheckCircle size={16} className="text-emerald-500 dark:text-emerald-400" />
                  )}
                  <span className={cn(
                    "text-xs font-black uppercase tracking-widest",
                    isOutOfStock
                      ? "text-rose-500 dark:text-rose-400"
                      : isInsufficientStock
                        ? "text-amber-500 dark:text-amber-400"
                        : "text-emerald-600 dark:text-emerald-400"
                  )}>
                    {isOutOfStock ? 'Out of Stock' : 'Available'}
                  </span>
                </div>
                <span className={cn(
                  "text-lg font-black tabular-nums",
                  isOutOfStock
                    ? "text-rose-500 dark:text-rose-400"
                    : isInsufficientStock
                      ? "text-amber-500 dark:text-amber-400"
                      : "text-emerald-600 dark:text-emerald-400"
                )}>
                  {selectedProduct.quantity} {lang === 'en' ? 'units' : 'begi'}
                </span>
              </div>

              {/* Quantity Selector */}
              <div className="flex flex-col items-center gap-3 py-2">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.quantity}</p>
                <div className="flex items-center gap-8">
                  <button
                    disabled={qty <= 1 || isOutOfStock}
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-30 active:scale-90 transition-all border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <Minus size={20} />
                  </button>
                  <div className="flex flex-col items-center">
                    <span className={cn(
                      "text-4xl font-bold min-w-[2.5rem] text-center tracking-tighter tabular-nums transition-colors",
                      isInsufficientStock ? "text-rose-500 dark:text-rose-400" : "text-slate-800 dark:text-slate-100"
                    )}>
                      {qty}
                    </span>
                    {isInsufficientStock && (
                      <span className="text-[9px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest mt-1">
                        Max: {selectedProduct.quantity}
                      </span>
                    )}
                  </div>
                  <button
                    disabled={qty >= selectedProduct.quantity || isOutOfStock}
                    onClick={() => setQty(q => Math.min(selectedProduct.quantity, q + 1))}
                    className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 disabled:opacity-30 active:scale-90 transition-all border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              <div className="pt-5 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.grandTotal}</p>
                  <p className={cn(
                    "text-2xl font-black tracking-tight tabular-nums transition-colors",
                    isInsufficientStock ? "text-rose-500 dark:text-rose-400" : "text-slate-900 dark:text-white"
                  )}>
                    {formatCurrency(selectedProduct.selling_price * qty)}
                  </p>
                </div>
                <button
                  onClick={handleSale}
                  disabled={!canConfirm}
                  className={cn(
                    "h-12 px-6 rounded-xl shadow-lg flex items-center gap-2 active:scale-95 transition-all text-xs font-black uppercase tracking-widest",
                    canConfirm
                      ? "bg-brand-primary hover:bg-brand-secondary text-white shadow-orange-100"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                  )}
                >
                  <ShoppingCart size={16} />
                  {t.confirm}
                </button>
              </div>
            </motion.div>
          </>
        )}


        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 pointer-events-none"
          >
            <div className="bg-white dark:bg-slate-900 text-brand-primary p-12 rounded-[3.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.2)] border border-orange-50 dark:border-slate-800 flex flex-col items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-2xl shadow-orange-200 dark:shadow-none">
                <CheckCircle size={56} strokeWidth={2.5} />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{t.saleConfirmed}</p>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">{t.transactionSuccessful}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}