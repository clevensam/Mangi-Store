import React, { useMemo } from 'react';
import { useQuery, gql } from '@apollo/client';
import { useLanguage } from '../../hooks/useLanguage';
import { ProductDetailsPresenter } from './ProductDetailsPresenter';

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

interface ProductDetailsContainerProps {
  productId: string;
  onBack: () => void;
}

export function ProductDetailsContainer({ productId, onBack }: ProductDetailsContainerProps) {
  const { lang, t } = useLanguage();

  const { loading, data } = useQuery(GET_PRODUCT_DETAILS, {
    variables: { id: productId }
  });

  const product = data?.product as Product;
  const sales = data?.productSales as Sale[] || [];
  const logs: any[] = [];

  const chartData = useMemo(() => {
    if (!sales) return [];
    const monthlyGroups: { [key: string]: { month: string; qty: number; total: number; timestamp: number } } = {};
    sales.forEach(sale => {
      const date = new Date(sale.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
      const monthLabel = date.toLocaleDateString(lang === 'en' ? 'en-US' : 'sw-TZ', { month: 'short', year: '2-digit' });
      if (!monthlyGroups[key]) {
        monthlyGroups[key] = { month: monthLabel, qty: 0, total: 0, timestamp: new Date(date.getFullYear(), date.getMonth(), 1).getTime() };
      }
      monthlyGroups[key].qty += sale.quantity;
      monthlyGroups[key].total += sale.total_price;
    });
    return Object.values(monthlyGroups).sort((a, b) => a.timestamp - b.timestamp).slice(-6);
  }, [sales, lang]);

  const totalSold = sales?.reduce((sum, s) => sum + s.quantity, 0) || 0;
  const totalRevenue = sales?.reduce((sum, s) => sum + s.total_price, 0) || 0;
  const profitPerUnit = product ? product.selling_price - product.buying_price : 0;

  return (
    <ProductDetailsPresenter
      t={t}
      lang={lang}
      productId={productId}
      onBack={onBack}
      product={product}
      sales={sales}
      chartData={chartData}
      loading={loading}
      logs={logs}
      totalSold={totalSold}
      totalRevenue={totalRevenue}
      profitPerUnit={profitPerUnit}
    />
  );
}
