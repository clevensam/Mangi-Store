import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { toast } from 'sonner';
import { translations, type Language } from '../lib/i18n';
import { formatCurrency, cn } from '../lib/utils';
import { Plus, Package, Edit2, X, Save, Search, Trash2, LayoutGrid, List } from 'lucide-react';
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

const CREATE_PRODUCT = gql`
  mutation CreateProduct($name: String!, $category: String!, $buying_price: Float!, $selling_price: Float!, $quantity: Int!, $low_stock_threshold: Int!) {
    createProduct(name: $name, category: $category, buying_price: $buying_price, selling_price: $selling_price, quantity: $quantity, low_stock_threshold: $low_stock_threshold) {
      id
      name
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

const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id)
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

export default function ProductsPage({ lang, onViewDetails }: Props) {
  const t = translations[lang];
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryType | 'all'>('all');

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: 'groceries',
    buying_price: 0,
    selling_price: 0,
    quantity: 0,
    low_stock_threshold: 5
  });

  const { loading, data, refetch } = useQuery(GET_PRODUCTS);
  const [createProduct] = useMutation(CREATE_PRODUCT);
  const [updateProduct] = useMutation(UPDATE_PRODUCT);
  const [deleteProduct] = useMutation(DELETE_PRODUCT);

  const products = data?.products as Product[] || [];

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || p.category.toLowerCase() === categoryFilter.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, categoryFilter]);

  const handleSave = async () => {
    if (!formData.name) {
      toast.error(lang === 'en' ? 'Product name is required' : 'Jina la bidhaa linahitajika');
      return;
    }

    try {
      if (editingId) {
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
        toast.success(lang === 'en' ? 'Product updated successfully' : 'Bidhaa imesasishwa kikamilifu');
      } else {
        await createProduct({
          variables: {
            name: formData.name,
            category: formData.category,
            buying_price: formData.buying_price,
            selling_price: formData.selling_price,
            quantity: formData.quantity,
            low_stock_threshold: formData.low_stock_threshold
          }
        });
        toast.success(lang === 'en' ? 'Product added to catalog' : 'Bidhaa imewekwa kwenye katalogi');
      }

      setShowAdd(false);
      setEditingId(null);
      setFormData({
        name: '',
        category: 'groceries',
        buying_price: 0,
        selling_price: 0,
        quantity: 0,
        low_stock_threshold: 5
      });
      refetch();
    } catch (error) {
      toast.error(lang === 'en' ? 'Failed to save product' : 'Imeshindwa kuhifadhi bidhaa');
    }
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
    setShowAdd(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(lang === 'en' ? 'Are you sure you want to delete this product?' : 'Una uhakika unataka kufuta bidhaa hii?')) return;

    try {
      await deleteProduct({ variables: { id } });
      toast.success(lang === 'en' ? 'Product deleted' : 'Bidhaa imefutwa');
      refetch();
    } catch (err: any) {
      const message = err?.message || 'Failed to delete product';
      toast.error(message);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative transition-colors duration-300">
      <div className="pt-8 px-8 pb-0 shrink-0">
        <div className="max-w-7xl mx-auto flex justify-between items-end">
          <div>
            <h2 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{t.products}</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">{t.manageCatalog}</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    viewMode === 'grid' ? "bg-slate-100 dark:bg-slate-800 text-brand-primary" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                  )}
                >
                  <LayoutGrid size={18} />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-2 rounded-lg transition-all",
                    viewMode === 'list' ? "bg-slate-100 dark:bg-slate-800 text-brand-primary" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                  )}
                >
                  <List size={18} />
                </button>
             </div>
             <button 
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    name: '',
                    category: 'groceries',
                    buying_price: 0,
                    selling_price: 0,
                    quantity: 0,
                    low_stock_threshold: 5
                  });
                  setShowAdd(true);
                }}
                className="h-11 px-6 rounded-xl bg-gradient-brand text-white flex items-center gap-2 shadow-lg shadow-orange-200 dark:shadow-none active:scale-95 hover:bg-gradient-brand-dark transition-all font-black uppercase tracking-widest text-[10px]"
              >
                <Plus size={18} />
                {t.addNew}
              </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-4 px-8 pb-8 no-scrollbar">
        <div className="max-w-7xl mx-auto pb-32 space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            {/* Table Toolbar */}
            <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-sm group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" size={18} />
                  <input
                    type="text"
                    placeholder={t.searchProductName}
                    className="w-full h-11 pl-11 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:bg-white dark:focus:bg-slate-750 focus:border-brand-primary/20 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 dark:text-slate-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-slate-700 shrink-0 overflow-x-auto no-scrollbar">
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
                      {t[cat as keyof typeof t]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {viewMode === 'list' ? (
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-50 dark:border-slate-800">
                      <th className="py-6 px-8 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.productName}</th>
                      <th className="py-6 px-6 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.category}</th>
                      <th className="py-6 px-6 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">{t.buying}</th>
                      <th className="py-6 px-6 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">{t.selling}</th>
                      <th className="py-6 px-8 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">{t.action}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    <AnimatePresence mode="popLayout">
                      {filteredProducts.map((product) => (
                        <motion.tr 
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          key={product.id}
                          className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                          onClick={() => onViewDetails?.(product.id)}
                        >
                          <td className="py-5 px-8">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-orange-100 dark:group-hover:bg-orange-950/30 group-hover:text-brand-primary transition-all overflow-hidden border border-slate-100 dark:border-slate-700">
                                <Package size={22} />
                              </div>
                              <span className="font-bold text-slate-900 dark:text-slate-100">{product.name}</span>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <span className={cn(
                               "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 ring-1 ring-inset ring-slate-100 dark:ring-slate-700"
                             )}>
                               {t[product.category as keyof typeof t] || product.category}
                             </span>
                          </td>
                          <td className="py-5 px-6 text-right font-bold text-slate-400 dark:text-slate-500 tabular-nums">
                            {formatCurrency(product.buying_price)}
                          </td>
                          <td className="py-5 px-6 text-right font-black text-slate-900 dark:text-slate-100 tabular-nums">
                            {formatCurrency(product.selling_price)}
                          </td>
                          <td className="py-5 px-8">
                            <div className="flex items-center justify-center gap-2">
                               <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(product);
                                  }} 
                                  className="h-10 w-10 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-400 hover:text-brand-primary hover:border-brand-primary/30 transition-all shadow-sm"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(product.id!);
                                  }} 
                                  className="h-10 w-10 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all shadow-sm"
                                >
                                  <Trash2 size={16} />
                                </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((product) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      key={product.id}
                      onClick={() => onViewDetails?.(product.id!)}
                      className="group bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none hover:border-brand-primary/20 cursor-pointer relative"
                    >
                      <div className="flex flex-col gap-5">
                        <div className="flex justify-between items-start">
                          <div className="h-14 w-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-center text-slate-400 group-hover:text-brand-primary transition-colors">
                            <Package size={28} />
                          </div>
                          <div className="flex gap-1 transition-opacity">
                             <button onClick={(e) => { e.stopPropagation(); handleEdit(product); }} className="p-2 bg-white dark:bg-slate-700 shadow-sm rounded-lg text-slate-400 hover:text-brand-primary transition-colors border border-slate-100 dark:border-slate-800">
                               <Edit2 size={14} />
                             </button>
                             <button onClick={(e) => { e.stopPropagation(); handleDelete(product.id!); }} className="p-2 bg-white dark:bg-slate-700 shadow-sm rounded-lg text-slate-400 hover:text-rose-500 transition-colors border border-slate-100 dark:border-slate-800">
                               <Trash2 size={14} />
                             </button>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <h4 className="font-black text-xl text-slate-900 dark:text-slate-100 leading-tight tracking-tight">{product.name}</h4>
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            {t[product.category as keyof typeof t] || product.category}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-end">
                           <div className="space-y-1">
                             <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">Buying Price</p>
                             <p className="font-bold text-slate-500 dark:text-slate-400 tabular-nums">{formatCurrency(product.buying_price)}</p>
                           </div>
                           <div className="text-right space-y-1">
                             <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">Selling Price</p>
                             <p className="font-black text-2xl text-brand-primary tabular-nums tracking-tighter">{formatCurrency(product.selling_price)}</p>
                           </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Pagination Placeholder */}
            <div className="p-6 border-t border-slate-50 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-800/10 flex justify-end gap-2 shrink-0">
               <button className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 cursor-not-allowed">Previous</button>
               <button className="h-8 w-8 flex items-center justify-center rounded-lg bg-brand-primary text-white text-xs font-black shadow-md shadow-orange-100 dark:shadow-none">1</button>
               <button className="h-8 w-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">2</button>
               <button className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-800 dark:text-slate-300 hover:text-brand-primary transition-colors">Next</button>
            </div>
          </div>
        </div>

        {filteredProducts.length === 0 && (
          <div className="max-w-7xl mx-auto py-32 text-center">
            <div className="inline-flex p-8 bg-white dark:bg-slate-900 rounded-full text-slate-200 dark:text-slate-800 mb-6 shadow-sm border border-slate-50 dark:border-slate-800 transition-colors">
              <Package size={64} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">No products found</h3>
            <p className="text-slate-400 dark:text-slate-500 mt-2 max-w-sm mx-auto">Try adjusting your filters or search terms to find what you're looking for.</p>
            <button 
              onClick={() => { setSearchTerm(''); setCategoryFilter('All'); }}
              className="mt-6 text-brand-primary font-bold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAdd && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAdd(false)} className="fixed inset-0 bg-slate-900/10 backdrop-blur-md z-[60]" />
            <div className="fixed inset-0 z-[70] overflow-y-auto pointer-events-none flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="pointer-events-auto w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 space-y-8 shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-300"
              >
                <div className="flex justify-between items-center shrink-0">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{editingId ? 'Edit Product' : 'Add Product'}</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">{editingId ? 'Update catalog details' : 'Create a new storefront entry'}</p>
                  </div>
                  <button onClick={() => setShowAdd(false)} className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl text-slate-400 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"><X size={20} /></button>
                </div>

                <div className="space-y-6 overflow-y-auto pr-1 pb-1 no-scrollbar flex-1">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t.productName}</label>
                    <input 
                      type="text" 
                      className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/30 transition-all font-bold text-slate-800 dark:text-slate-100 text-base placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none" 
                      placeholder="e.g. Fresh Milk"
                      value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t.buyingPrice}</label>
                        <div className="relative group">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-slate-400 dark:text-slate-500 text-xs group-focus-within:text-brand-primary transition-colors">Tsh</span>
                        <input 
                          type="number" 
                          className="w-full h-14 pl-14 pr-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/30 font-bold text-slate-800 dark:text-slate-100 text-lg tabular-nums outline-none transition-all" 
                          value={formData.buying_price} onChange={e => setFormData({...formData, buying_price: Number(e.target.value)})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t.sellingPrice}</label>
                      <div className="relative group">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 font-bold text-slate-400 dark:text-slate-500 text-xs group-focus-within:text-brand-primary transition-colors">Tsh</span>
                        <input 
                          type="number" 
                          className="w-full h-14 pl-14 pr-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/30 font-black text-slate-900 dark:text-brand-primary text-xl tabular-nums outline-none transition-all" 
                          value={formData.selling_price} onChange={e => setFormData({...formData, selling_price: Number(e.target.value)})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t.currentStock}</label>
                      <input 
                        type="number" 
                        className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/30 font-bold text-slate-800 dark:text-slate-100 text-base outline-none transition-all" 
                        value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t.lowStockAlert}</label>
                      <input 
                        type="number" 
                        className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/30 font-bold text-slate-800 dark:text-slate-100 text-base outline-none transition-all" 
                        value={formData.low_stock_threshold} onChange={e => setFormData({...formData, low_stock_threshold: Number(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t.category}</label>
                    <div className="grid grid-cols-3 gap-2">
                      {CATEGORIES.filter(c => c !== 'all').map(c => (
                        <button
                          key={c}
                          onClick={() => setFormData({...formData, category: c})}
                          className={cn(
                            "px-3 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shrink-0",
                            formData.category === c 
                              ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-xl shadow-slate-200 dark:shadow-none" 
                              : "bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:border-brand-primary/30 dark:hover:border-slate-600"
                          )}
                        >
                          {t[c as keyof typeof t]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 pt-4 border-t border-slate-50 dark:border-slate-800 flex gap-3">
                  <button 
                    onClick={() => setShowAdd(false)}
                    className="flex-1 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
                  >
                    {t.cancel}
                  </button>
                  <button 
                    onClick={handleSave}
                    className="flex-[2] h-14 bg-brand-primary text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-orange-100 dark:shadow-none hover:bg-brand-secondary active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    {editingId ? t.updateCatalog : t.addToCatalog}
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
