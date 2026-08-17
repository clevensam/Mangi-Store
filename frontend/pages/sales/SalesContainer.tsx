import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useProducts } from '../../hooks/useProducts';
import { useSales } from '../../hooks/useSales';
import { useSearch } from '../../hooks/useSearch';
import { useLanguage } from '../../hooks/useLanguage';
import { useCart } from '../../hooks/useCart';
import { formatCurrency } from '../../lib/utils';
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

export type OrderType = 'dine_in' | 'takeout' | 'curbside';

let orderNumberCounter = 1001;

export function SalesContainer() {
  const { lang, t } = useLanguage();
  const { products, loading, refetch } = useProducts();
  const { recordSale } = useSales();

  const [categoryFilter, setCategoryFilter] = useState<PosCategoryType>('all');
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [tableNumber, setTableNumber] = useState('01');
  const [customerName, setCustomerName] = useState('');
  const [showFireConfirm, setShowFireConfirm] = useState(false);
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

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleFire = useCallback(() => {
    if (cart.items.length === 0) return;
    setShowFireConfirm(true);
    setTimeout(() => {
      setShowFireConfirm(false);
      toast.success(t.orderSent, { description: t.orderSentDesc });
    }, 1500);
  }, [cart.items.length, t]);

  const handleCharge = useCallback(async () => {
    if (cart.items.length === 0) return;

    try {
      for (const item of cart.items) {
        if (item.quantity > item.price) {
          const product = products.find((p) => p.id === item.productId);
          if (product && item.quantity > product.quantity) {
            toast.error(
              lang === 'en'
                ? `Insufficient stock for ${item.name}. Only ${product.quantity} available.`
                : `Stock haipatoshi kwa ${item.name}. Kuna ${product.quantity} peke yake.`,
            );
            return;
          }
        }
        const total = item.price * item.quantity;
        await recordSale(item.productId, item.quantity, total);
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
      allProducts={products as Product[]}
      loading={loading}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      categoryFilter={categoryFilter}
      onCategoryFilterChange={setCategoryFilter}
      categories={POS_CATEGORIES}
      cart={cart}
      onAddToOrder={handleAddToOrder}
      orderType={orderType}
      onOrderTypeChange={setOrderType}
      tableNumber={tableNumber}
      onTableNumberChange={setTableNumber}
      customerName={customerName}
      onCustomerNameChange={setCustomerName}
      orderNumber={orderNumber}
      onPrint={handlePrint}
      onFire={handleFire}
      onCharge={handleCharge}
      showFireConfirm={showFireConfirm}
      showPaymentSuccess={showPaymentSuccess}
    />
  );
}
