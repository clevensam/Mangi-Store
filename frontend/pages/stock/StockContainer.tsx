import React, { useState, useMemo } from 'react';
import { useQuery, gql } from '@apollo/client';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../contexts/AuthContext';
import { StockPresenter } from './StockPresenter';

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

const GET_LATEST_BAKI = gql`
  query LatestStockBaki {
    latestStockBaki {
      productId
      baki
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

export function StockContainer() {
  const { t } = useLanguage();
  const { can } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Product; direction: 'asc' | 'desc' } | null>(null);

  const { loading: productsLoading, data, error, refetch } = useQuery(GET_PRODUCTS);
  const { loading: bakiLoading, data: bakiData } = useQuery(GET_LATEST_BAKI);

  const baseProducts = data?.products as Product[] || [];

  // Override displayed stock with the latest Baki (remaining) saved on the report
  const bakiMap = useMemo(() => {
    const map: Record<string, number> = {};
    (bakiData?.latestStockBaki ?? []).forEach((b: any) => {
      map[b.productId] = b.baki;
    });
    return map;
  }, [bakiData]);

  const products: Product[] = useMemo(() => {
    return baseProducts.map((p) => ({
      ...p,
      quantity: bakiMap[p.id] !== undefined ? bakiMap[p.id] : p.quantity,
    }));
  }, [baseProducts, bakiMap]);

  const handleSort = (key: keyof Product) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedProducts = useMemo(() => {
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

  if (!can('owner', 'manager')) return null;

  return (
    <StockPresenter
      t={t}
      products={products}
      filteredProducts={filteredAndSortedProducts}
      loading={productsLoading || bakiLoading}
      error={error?.message || null}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      categoryFilter={categoryFilter}
      onCategoryFilterChange={setCategoryFilter}
      sortConfig={sortConfig}
      onSort={handleSort}
      onRefresh={refetch}
    />
  );
}
