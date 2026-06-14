import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { toast } from 'sonner';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../contexts/AuthContext';
import { ProductsPresenter } from './ProductsPresenter';

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

export const CATEGORIES = ['all', 'beer', 'spirits', 'soft_drinks', 'water'] as const;
export type CategoryType = typeof CATEGORIES[number];

interface ProductsContainerProps {
  onViewDetails?: (id: string) => void;
}

export function ProductsContainer({ onViewDetails }: ProductsContainerProps) {
  const { lang, t } = useLanguage();
  const { can } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryType | 'all'>('all');

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: 'beer',
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

    if (formData.selling_price !== undefined && formData.buying_price !== undefined && formData.buying_price >= formData.selling_price) {
      toast.info(lang === 'en' ? 'Buying price cannot be greater than or equal to selling price' : 'Bei ya kununua haiwezi kuwa kubwa au sawa na bei ya kuuza');
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
      setFormData({ name: '', category: 'beer', buying_price: 0, selling_price: 0, quantity: 0, low_stock_threshold: 5 });
      refetch();
    } catch (error: any) {
      const message = error?.message || '';
      if (message.includes('Selling price must be greater than buying price')) {
        toast.info(lang === 'en' ? 'Buying price cannot be greater than or equal to selling price' : 'Bei ya kununua haiwezi kuwa kubwa au sawa na bei ya kuuza');
      } else {
        toast.error(lang === 'en' ? 'Failed to save product' : 'Imeshindwa kuhifadhi bidhaa');
      }
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
      toast.error(err?.message || 'Failed to delete product');
    }
  };

  return (
    <ProductsPresenter
      t={t}
      lang={lang}
      can={can}
      products={products}
      filteredProducts={filteredProducts}
      loading={loading}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      categoryFilter={categoryFilter}
      onCategoryFilterChange={(v) => setCategoryFilter(v as CategoryType | 'all')}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      showAdd={showAdd}
      editingId={editingId}
      formData={formData}
      onFormDataChange={setFormData}
      onAddNew={() => {
        setEditingId(null);
        setFormData({ name: '', category: 'beer', buying_price: 0, selling_price: 0, quantity: 0, low_stock_threshold: 5 });
        setShowAdd(true);
      }}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onSave={handleSave}
      onCloseModal={() => { setShowAdd(false); setEditingId(null); }}
      onViewDetails={onViewDetails}
    />
  );
}
