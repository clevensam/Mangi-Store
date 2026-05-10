import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { toast } from 'sonner';
import { translations, type Language } from '../lib/i18n';
import { formatCurrency, cn } from '../lib/utils';
import { Plus, Receipt, Zap, Home, Droplets, Wifi, Car, Wrench, Utensils, MoreHorizontal, Search, Calendar, DollarSign, Edit2, Trash2, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

interface Props {
  lang: Language;
}

const EXPENSE_CATEGORIES = [
  { id: 'electricity', label: 'electricity', icon: Zap },
  { id: 'rent', label: 'rent', icon: Home },
  { id: 'water', label: 'water', icon: Droplets },
  { id: 'internet', label: 'internet', icon: Wifi },
  { id: 'transport', label: 'transport', icon: Car },
  { id: 'maintenance', label: 'maintenance', icon: Wrench },
  { id: 'food', label: 'food', icon: Utensils },
  { id: 'other', label: 'otherExpense', icon: MoreHorizontal },
];

export default function ExpensesPage({ lang }: Props) {
  const t = translations[lang];
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<OperatingExpense | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    status: 'paid'
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

  const getCategoryIcon = (category: string) => {
    const cat = EXPENSE_CATEGORIES.find(c => c.id === category);
    return cat ? cat.icon : MoreHorizontal;
  };

  const getCategoryLabel = (category: string) => {
    const cat = EXPENSE_CATEGORIES.find(c => c.id === category);
    return cat ? t[cat.label as keyof typeof t] : category;
  };

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

  const resetForm = () => {
    setFormData({ category: '', description: '', amount: '', expenseDate: new Date().toISOString().split('T')[0], status: 'paid' });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative transition-colors duration-300">
      <div className="pt-8 px-8 pb-0 shrink-0">
        <div className="max-w-7xl mx-auto flex justify-between items-end">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">{t.operatingExpenses}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t.operatingExpensesDesc}</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="h-11 px-6 rounded-xl bg-gradient-brand text-white flex items-center gap-2 shadow-lg shadow-orange-200 dark:shadow-none active:scale-95 hover:bg-gradient-brand-dark transition-all font-semibold text-sm"
          >
            <Plus size={18} />
            {t.addExpense}
          </button>
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto no-scrollbar pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all",
              !selectedCategory
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
            )}
          >
            {t.all}
          </button>
          {EXPENSE_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all flex items-center gap-2",
                  selectedCategory === cat.id
                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                    : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                )}
              >
                <Icon size={16} />
                {t[cat.label as keyof typeof t]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-4 px-8 pb-8 no-scrollbar">
        <div className="max-w-7xl mx-auto pb-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <DollarSign size={18} className="text-slate-500" />
                </div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.totalExpenses}</span>
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-2xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                  <Calendar size={18} className="text-amber-500" />
                </div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.thisMonth}</span>
              </div>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(monthlyTotal)}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                  <Receipt size={18} className="text-blue-500" />
                </div>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.expenses}</span>
              </div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{expenses.length}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            <div className="p-6 border-b border-slate-50 dark:border-slate-800">
              <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder={t.searchExpenses}
                  className="w-full h-11 pl-11 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/20 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 border-3 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="py-20 text-center">
                <div className="inline-flex p-6 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-300 dark:text-slate-700 mb-4">
                  <Receipt size={48} />
                </div>
                <p className="text-slate-400 dark:text-slate-500 font-medium">{t.noExpenses}</p>
              </div>
            ) : (
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-50 dark:border-slate-800">
                      <th className="py-6 px-8 text-xs font-medium text-slate-400 dark:text-slate-500">{t.expenseCategory}</th>
                      <th className="py-6 px-6 text-xs font-medium text-slate-400 dark:text-slate-500">{t.description}</th>
                      <th className="py-6 px-6 text-xs font-medium text-slate-400 dark:text-slate-500 text-right">{t.amount}</th>
                      <th className="py-6 px-6 text-xs font-medium text-slate-400 dark:text-slate-500">{t.expenseDate}</th>
                      <th className="py-6 px-8 text-xs font-medium text-slate-400 dark:text-slate-500 text-right">{t.action}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {filteredExpenses.map((expense) => {
                      const Icon = getCategoryIcon(expense.category);
                      return (
                        <tr key={expense.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-5 px-8">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                <Icon size={18} />
                              </div>
                              <span className="font-semibold text-slate-900 dark:text-slate-100">{getCategoryLabel(expense.category)}</span>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <span className="text-slate-500 dark:text-slate-400">{expense.description || '-'}</span>
                          </td>
                          <td className="py-5 px-6 text-right">
                            <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(expense.amount)}</span>
                          </td>
                          <td className="py-5 px-6">
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                              {new Date(expense.expenseDate).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="py-5 px-8">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditModal(expense)}
                                className="h-9 w-9 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-brand-primary hover:border-brand-primary/30 transition-all"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(expense.id)}
                                className="h-9 w-9 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-slate-900/10 backdrop-blur-md z-[60]"
            />
            <div className="fixed inset-0 z-[70] overflow-y-auto pointer-events-none flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="pointer-events-auto w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 space-y-6 shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-800"
              >
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100">{t.addExpense}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t.expenseDetails}</p>
                  </div>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl text-slate-400 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">{t.expenseCategory} *</label>
                    <select
                      className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/30 transition-all text-slate-800 dark:text-slate-100 text-base outline-none appearance-none"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="">{lang === 'en' ? 'Select category...' : 'Chagua kundi...'}</option>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>{t[cat.label as keyof typeof t]}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">{t.amount} *</label>
                    <input
                      type="number"
                      className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/30 transition-all text-slate-800 dark:text-slate-100 text-base outline-none"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">{t.expenseDate}</label>
                    <input
                      type="date"
                      className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/30 transition-all text-slate-800 dark:text-slate-100 text-base outline-none"
                      value={formData.expenseDate}
                      onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">{t.description}</label>
                    <input
                      type="text"
                      className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/30 transition-all text-slate-800 dark:text-slate-100 text-base outline-none"
                      placeholder={lang === 'en' ? 'Add description (optional)' : 'Ongeza maelezo (hiari)'}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex gap-3">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-[2] h-14 bg-brand-primary text-white font-semibold text-sm rounded-2xl shadow-xl shadow-orange-100 dark:shadow-none hover:bg-orange-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    {t.addExpense}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEditModal(false)}
              className="fixed inset-0 bg-slate-900/10 backdrop-blur-md z-[60]"
            />
            <div className="fixed inset-0 z-[70] overflow-y-auto pointer-events-none flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="pointer-events-auto w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 space-y-6 shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-800"
              >
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100">{t.editExpense}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t.expenseDetails}</p>
                  </div>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl text-slate-400 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">{t.expenseCategory} *</label>
                    <select
                      className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/30 transition-all text-slate-800 dark:text-slate-100 text-base outline-none appearance-none"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="">{lang === 'en' ? 'Select category...' : 'Chagua kundi...'}</option>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>{t[cat.label as keyof typeof t]}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">{t.amount} *</label>
                    <input
                      type="number"
                      className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/30 transition-all text-slate-800 dark:text-slate-100 text-base outline-none"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">{t.expenseDate}</label>
                    <input
                      type="date"
                      className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/30 transition-all text-slate-800 dark:text-slate-100 text-base outline-none"
                      value={formData.expenseDate}
                      onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">{t.description}</label>
                    <input
                      type="text"
                      className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/30 transition-all text-slate-800 dark:text-slate-100 text-base outline-none"
                      placeholder={lang === 'en' ? 'Add description (optional)' : 'Ongeza maelezo (hiari)'}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex gap-3">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="flex-[2] h-14 bg-brand-primary text-white font-semibold text-sm rounded-2xl shadow-xl shadow-orange-100 dark:shadow-none hover:bg-orange-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    {t.updateExpense}
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