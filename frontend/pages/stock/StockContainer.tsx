import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { toast } from 'sonner';
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

export function StockContainer() {
  const { lang, t } = useLanguage();
  const { can } = useAuth();
  const [showRestock, setShowRestock] = useState(false);
  const [restockId, setRestockId] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState<number>(0);
  const [showEdit, setShowEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '', category: 'beer', buying_price: 0, selling_price: 0, quantity: 0, low_stock_threshold: 5
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
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
      name: p.name, category: p.category, buying_price: p.buying_price,
      selling_price: p.selling_price, quantity: p.quantity, low_stock_threshold: p.low_stock_threshold
    });
    setEditingId(p.id);
    setShowEdit(true);
  };

  const handleSaveProduct = async () => {
    if (!editingId || !formData.name) return;
    try {
      await updateProduct({
        variables: {
          id: editingId, name: formData.name, category: formData.category,
          buying_price: formData.buying_price, selling_price: formData.selling_price,
          quantity: formData.quantity, low_stock_threshold: formData.low_stock_threshold
        }
      });
      toast.success('Product updated successfully');
      setShowEdit(false);
      setEditingId(null);
      refetch();
    } catch { toast.error('Failed to update product'); }
  };

  const confirmRestock = async () => {
    if (!restockId || restockQty <= 0) return;
    const product = products.find(p => p.id === restockId);
    if (product) {
      try {
        await updateProduct({ variables: { id: restockId, quantity: product.quantity + restockQty } });
        toast.success(`Restocked ${restockQty} units of ${product.name}`);
        refetch();
      } catch { toast.error('Restock failed'); }
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
    <StockPresenter
      t={t}
      can={can}
      products={products}
      filteredProducts={filteredAndSortedProducts}
      loading={loading}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      categoryFilter={categoryFilter}
      onCategoryFilterChange={setCategoryFilter}
      sortConfig={sortConfig}
      onSort={handleSort}
      showRestock={showRestock}
      restockId={restockId}
      restockQty={restockQty}
      onRestockQtyChange={setRestockQty}
      onRestock={handleRestock}
      onConfirmRestock={confirmRestock}
      onCloseRestock={() => { setShowRestock(false); setRestockId(null); setRestockQty(0); }}
      showEdit={showEdit}
      editingId={editingId}
      formData={formData}
      onFormDataChange={setFormData}
      onEdit={handleEdit}
      onSaveEdit={handleSaveProduct}
      onCloseEdit={() => { setShowEdit(false); setEditingId(null); }}
    />
  );
}
