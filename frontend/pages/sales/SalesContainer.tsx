import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useProducts } from '../../hooks/useProducts';
import { useSales } from '../../hooks/useSales';
import { useSearch } from '../../hooks/useSearch';
import { useLanguage } from '../../hooks/useLanguage';
import { useCart } from '../../hooks/useCart';
import { SalesPresenter } from './SalesPresenter';

const POS_CATEGORIES = ['all', 'beer', 'spirits', 'soft_drinks', 'water'] as const;
type PosCategoryType = typeof POS_CATEGORIES[number];

export interface Product {
  id: string;
  name: string;
  category: string;
  selling_price: number;
  quantity: number;
}

let orderNumberCounter = 1001;

export function SalesContainer() {
  const { lang, t } = useLanguage();
  const { products, loading, refetch } = useProducts();
  const { recordSale } = useSales();

  const [categoryFilter, setCategoryFilter] = useState<PosCategoryType>('all');
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);

  const cart = useCart();

  const { query: searchTerm, setQuery: setSearchTerm, filtered: filteredProducts } =
    useSearch(products, ['name', 'category']);

  const displayProducts = filteredProducts.filter((p) => {
    const matchesCategory =
      categoryFilter === 'all' || p.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesCategory && p.quantity > 0;
  });

  const handleAddToOrder = useCallback(
    (product: Product) => {
      if (product.quantity === 0) {
        toast.error(lang === 'en' ? 'Out of stock' : 'Hakuna stock');
        return;
      }
      cart.addItem(product);
    },
    [cart, lang],
  );

  const handleCharge = useCallback(async () => {
    if (cart.items.length === 0) return;

    try {
      for (let i = 0; i < cart.items.length; i++) {
        const item = cart.items[i];
        const product = products.find((p) => p.id === item.productId);
        if (product && item.quantity > product.quantity) {
          toast.error(
            lang === 'en'
              ? `Insufficient stock for ${item.name}. Only ${product.quantity} available.`
              : `Stock haipatoshi kwa ${item.name}. Kuna ${product.quantity} peke yake.`,
          );
          return;
        }
        const total = item.price * item.quantity;
        // First line of a checkout records the Order (checkout count); the rest just add line items.
        await recordSale(item.productId, item.quantity, total, i === 0);
      }

      orderNumberCounter++;
      cart.clearCart();
      setShowPaymentSuccess(true);
      refetch();
      setTimeout(() => setShowPaymentSuccess(false), 2000);
      toast.success(t.paymentProcessed, { description: t.paymentProcessedDesc });
    } catch (err: any) {
      toast.error(err?.message || 'Payment failed');
    }
  }, [cart, products, recordSale, refetch, lang, t]);

  const orderNumber = orderNumberCounter;

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
      categories={POS_CATEGORIES}
      cart={cart}
      onAddToOrder={handleAddToOrder}
      orderNumber={orderNumber}
      onCharge={handleCharge}
      showPaymentSuccess={showPaymentSuccess}
    />
  );
}
