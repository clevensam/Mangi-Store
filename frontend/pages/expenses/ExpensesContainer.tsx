import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { toast } from 'sonner';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../contexts/AuthContext';
import { ExpensesPresenter } from './ExpensesPresenter';

const GET_EXPENSES = gql`
  query GetOperatingExpenses($category: String) {
    operatingExpenses(category: $category) {
      id
      category
      description
      amount
      expenseDate
      status
      createdAt
    }
    expenseTotalsByCategory {
      category
      total
    }
  }
`;

const CREATE_EXPENSE = gql`
  mutation CreateOperatingExpense($category: String!, $description: String, $amount: Float!, $expenseDate: String!, $status: String) {
    createOperatingExpense(category: $category, description: $description, amount: $amount, expenseDate: $expenseDate, status: $status) {
      id
      category
    }
  }
`;

const UPDATE_EXPENSE = gql`
  mutation UpdateOperatingExpense($id: ID!, $category: String, $description: String, $amount: Float, $expenseDate: String, $status: String) {
    updateOperatingExpense(id: $id, category: $category, description: $description, amount: $amount, expenseDate: $expenseDate, status: $status) {
      id
      category
    }
  }
`;

const DELETE_EXPENSE = gql`
  mutation DeleteOperatingExpense($id: ID!) {
    deleteOperatingExpense(id: $id)
  }
`;

interface OperatingExpense {
  id: string;
  category: string;
  description: string | null;
  amount: number;
  expenseDate: string;
  status: string;
  createdAt: string;
}

interface ExpenseCategoryTotal {
  category: string;
  total: number;
}

export function ExpensesContainer() {
  const { lang, t } = useLanguage();
  const { can } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<OperatingExpense | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    category: '', description: '', amount: '', expenseDate: new Date().toISOString().split('T')[0], status: 'paid'
  });

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const { loading, data, refetch } = useQuery(GET_EXPENSES, {
    variables: { category: selectedCategory }
  });

  const [createExpense] = useMutation(CREATE_EXPENSE);
  const [updateExpense] = useMutation(UPDATE_EXPENSE);
  const [deleteExpense] = useMutation(DELETE_EXPENSE);

  const expenses = data?.operatingExpenses as OperatingExpense[] || [];
  const categoryTotals = data?.expenseTotalsByCategory as ExpenseCategoryTotal[] || [];

  const monthlyTotal = expenses
    .filter(e => {
      const expenseDate = new Date(e.expenseDate);
      return expenseDate.getFullYear() === currentYear && expenseDate.getMonth() + 1 === currentMonth;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const filteredExpenses = expenses.filter(e =>
    e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalExpenses = categoryTotals.reduce((sum, c) => sum + c.total, 0);

  const handleSave = async () => {
    if (!formData.category || !formData.amount) {
      toast.error(lang === 'en' ? 'Category and amount are required' : 'Kundi na kiasi vinahitajika');
      return;
    }
    try {
      await createExpense({
        variables: {
          category: formData.category,
          description: formData.description || null,
          amount: parseFloat(formData.amount),
          expenseDate: formData.expenseDate,
          status: formData.status
        }
      });
      toast.success(lang === 'en' ? 'Expense added successfully' : 'Gharama imeongezwa kikamilifu');
      setShowAddModal(false);
      setFormData({ category: '', description: '', amount: '', expenseDate: new Date().toISOString().split('T')[0], status: 'paid' });
      refetch();
    } catch (err: any) {
      toast.error(err.message || (lang === 'en' ? 'Failed to add expense' : 'Imeshindwa kuongeza gharama'));
    }
  };

  const handleUpdate = async () => {
    if (!editingExpense || !formData.category || !formData.amount) {
      toast.error(lang === 'en' ? 'Category and amount are required' : 'Kundi na kiasi vinahitajika');
      return;
    }
    try {
      await updateExpense({
        variables: {
          id: editingExpense.id,
          category: formData.category,
          description: formData.description || null,
          amount: parseFloat(formData.amount),
          expenseDate: formData.expenseDate,
          status: formData.status
        }
      });
      toast.success(lang === 'en' ? 'Expense updated successfully' : 'Gharama imesasishwa kikamilifu');
      setShowEditModal(false);
      setEditingExpense(null);
      setFormData({ category: '', description: '', amount: '', expenseDate: new Date().toISOString().split('T')[0], status: 'paid' });
      refetch();
    } catch (err: any) {
      toast.error(err.message || (lang === 'en' ? 'Failed to update expense' : 'Imeshindwa kusasisha gharama'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(lang === 'en' ? 'Are you sure you want to delete this expense?' : 'Una uhakika unataka kufuta gharama hii?')) return;
    try {
      await deleteExpense({ variables: { id } });
      toast.success(lang === 'en' ? 'Expense deleted' : 'Gharama imefutwa');
      refetch();
    } catch (err: any) {
      toast.error(err.message || (lang === 'en' ? 'Failed to delete expense' : 'Imeshindwa kufuta gharama'));
    }
  };

  const openEditModal = (expense: OperatingExpense) => {
    setEditingExpense(expense);
    setFormData({
      category: expense.category,
      description: expense.description || '',
      amount: expense.amount.toString(),
      expenseDate: expense.expenseDate,
      status: expense.status
    });
    setShowEditModal(true);
  };

  if (!can('owner', 'manager')) return null;

  return (
    <ExpensesPresenter
      t={t}
      lang={lang}
      expenses={expenses}
      filteredExpenses={filteredExpenses}
      loading={loading}
      totalExpenses={totalExpenses}
      monthlyTotal={monthlyTotal}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      selectedCategory={selectedCategory}
      onCategoryChange={setSelectedCategory}
      showAddModal={showAddModal}
      showEditModal={showEditModal}
      editingExpense={editingExpense}
      formData={formData}
      onFormDataChange={setFormData}
      onAddNew={() => {
        setFormData({ category: '', description: '', amount: '', expenseDate: new Date().toISOString().split('T')[0], status: 'paid' });
        setShowAddModal(true);
      }}
      onEdit={openEditModal}
      onDelete={handleDelete}
      onSave={handleSave}
      onUpdate={handleUpdate}
      onCloseAdd={() => { setShowAddModal(false); }}
      onCloseEdit={() => { setShowEditModal(false); setEditingExpense(null); }}
    />
  );
}
