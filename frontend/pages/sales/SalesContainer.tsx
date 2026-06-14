import React, { useState } from 'react';
import { toast } from 'sonner';
import { useProducts } from '../../hooks/useProducts';
import { useSales } from '../../hooks/useSales';
import { useSearch } from '../../hooks/useSearch';
import { useLanguage } from '../../hooks/useLanguage';
import { formatCurrency } from '../../lib/utils';
import { SalesPresenter } from './SalesPresenter';

const CATEGORIES = ['all', 'beer', 'spirits', 'soft_drinks', 'water'] as const;
type CategoryType = typeof CATEGORIES[number];

export interface Product {
  id: string;
  name: string;
  category: string;
  selling_price: number;
  quantity: number;
}

export function SalesContainer() {
  const { lang, t } = useLanguage();
  const { products, loading } = useProducts();
  const { recordSale } = useSales();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState<CategoryType>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showSuccess, setShowSuccess] = useState(false);

  const { query: searchTerm, setQuery: setSearchTerm, filtered: filteredProducts } =
    useSearch(products, ['name', 'category']);

  const displayProducts = filteredProducts.filter(p => {
    const matchesCategory = categoryFilter === 'all' || p.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesCategory;
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
      await recordSale(selectedProduct.id, qty, total);

      setSelectedProduct(null);
      setQty(1);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);

      toast.success(lang === 'en' ? 'Sale recorded successfully' : 'Mauzo yamefanikiwa', {
        description: lang === 'en'
          ? `Sold ${qty}x ${selectedProduct.name} for ${formatCurrency(total)}`
          : `Umeuza ${qty}x ${selectedProduct.name} kwa ${formatCurrency(total)}`,
      });
    } catch (err: any) {
      toast.error(err?.message || 'Sale recording failed');
    }
  };

  return (
    <SalesPresenter
      lang={lang}
      t={t}
      products={displayProducts as Product[]}
      loading={loading}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      categoryFilter={categoryFilter}
      onCategoryFilterChange={setCategoryFilter}
      categories={CATEGORIES}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      selectedProduct={selectedProduct}
      onProductSelect={(p) => { setSelectedProduct(p); setQty(1); }}
      qty={qty}
      onQtyChange={setQty}
      showSuccess={showSuccess}
      onSaleConfirm={handleSale}
      onModalClose={() => setSelectedProduct(null)}
    />
  );
}
