import React, { useState, useMemo } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useQuery, useMutation, gql } from '@apollo/client';
import { toast } from 'sonner';
import { translations, type Language } from '../lib/i18n';
import { formatCurrency, cn } from '../lib/utils';
import { Plus, CreditCard, User, Calendar, DollarSign, Clock, CheckCircle, AlertCircle, X, Save, ChevronRight, ArrowRightLeft, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const GET_DEBTS = gql`
  query GetDebts($type: String) {
    debts(type: $type) {
      id
      type
      customerId
      customer {
        id
        name
        phone
      }
      supplierName
      amount
      amountPaid
      remaining
      dueDate
      status
      description
      createdAt
    }
  }
`;

const GET_CUSTOMERS = gql`
  query GetCustomers {
    customers {
      id
      name
      phone
    }
  }
`;

const CREATE_DEBT = gql`
  mutation CreateDebt($type: String!, $customerId: ID, $supplierName: String, $amount: Float!, $dueDate: String!, $description: String) {
    createDebt(type: $type, customerId: $customerId, supplierName: $supplierName, amount: $amount, dueDate: $dueDate, description: $description) {
      id
      type
    }
  }
`;

const RECORD_PAYMENT = gql`
  mutation RecordDebtPayment($debtId: ID!, $amount: Float!, $notes: String) {
    recordDebtPayment(debtId: $debtId, amount: $amount, notes: $notes) {
      id
      amountPaid
      remaining
      status
    }
  }
`;

interface Debt {
  id: string;
  type: string;
  customerId: string | null;
  customer: {
    id: string;
    name: string;
    phone: string;
  } | null;
  supplierName: string | null;
  amount: number;
  amountPaid: number;
  remaining: number;
  dueDate: string;
  status: string;
  description: string | null;
  createdAt: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
}

interface Props {
  lang: Language;
}

export default function DebtsPage({ lang }: Props) {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'payable' | 'receivable'>('payable');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    customerId: '',
    supplierName: '',
    amount: '',
    dueDate: '',
    description: ''
  });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const { data: debtsData, loading: debtsLoading, refetch } = useQuery(GET_DEBTS, {
    variables: { type: activeTab }
  });

  const { data: customersData } = useQuery(GET_CUSTOMERS);

  const [createDebt] = useMutation(CREATE_DEBT);
  const [recordPayment] = useMutation(RECORD_PAYMENT);

  const debts = debtsData?.debts as Debt[] || [];
  const customers = customersData?.customers as Customer[] || [];

  const filteredDebts = useMemo(() => {
    return debts.filter(debt => {
      const searchLower = searchTerm.toLowerCase();
      const customerName = debt.customer?.name?.toLowerCase() || '';
      const supplierName = debt.supplierName?.toLowerCase() || '';
      return customerName.includes(searchLower) || supplierName.includes(searchLower);
    });
  }, [debts, searchTerm]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return { class: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900', icon: CheckCircle };
      case 'overdue':
        return { class: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900', icon: AlertCircle };
      case 'partial':
        return { class: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900', icon: Clock };
      default:
        return { class: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700', icon: Clock };
    }
  };

  const getDaysInfo = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleAddDebt = async () => {
    if (!formData.amount) {
      toast.error(lang === 'en' ? 'Amount is required' : 'Kiasi kinahitajika');
      return;
    }

    if (activeTab === 'receivable' && !formData.customerId) {
      toast.error(lang === 'en' ? 'Please select a customer' : 'Tafadhali chagua mteja');
      return;
    }

    if (activeTab === 'payable' && !formData.supplierName.trim()) {
      toast.error(lang === 'en' ? 'Supplier name is required' : 'Jina la msambazaji linahitajika');
      return;
    }

    try {
      await createDebt({
        variables: {
          type: activeTab,
          customerId: activeTab === 'receivable' ? formData.customerId : null,
          supplierName: activeTab === 'payable' ? formData.supplierName : null,
          amount: parseFloat(formData.amount),
          dueDate: formData.dueDate || null,
          description: formData.description || null
        }
      });
      toast.success(lang === 'en' ? 'Debt added successfully' : 'Deni limeongezwa kikamilifu');
      setShowAddModal(false);
      setFormData({ customerId: '', supplierName: '', amount: '', dueDate: '', description: '' });
      refetch();
    } catch (err: any) {
      toast.error(err.message || (lang === 'en' ? 'Failed to add debt' : 'Imeshindwa kuongeza deni'));
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error(lang === 'en' ? 'Please enter a valid amount' : 'Tafadhali ingiza kiasi sahihi');
      return;
    }

    if (selectedDebt && parseFloat(paymentAmount) > selectedDebt.remaining) {
      toast.error(lang === 'en' ? 'Payment exceeds remaining amount' : 'Malipo yanazidi kiasi kiliobaki');
      return;
    }

    try {
      await recordPayment({
        variables: {
          debtId: selectedDebt?.id,
          amount: parseFloat(paymentAmount),
          notes: paymentNotes || null
        }
      });
      toast.success(lang === 'en' ? 'Payment recorded successfully' : 'Malipo yamekasiriwa kikamilifu');
      setShowPaymentModal(false);
      setSelectedDebt(null);
      setPaymentAmount('');
      setPaymentNotes('');
      refetch();
    } catch (err: any) {
      toast.error(err.message || (lang === 'en' ? 'Failed to record payment' : 'Imeshindwa kurekodi malipo'));
    }
  };

  const openPaymentModal = (debt: Debt) => {
    setSelectedDebt(debt);
    setPaymentAmount(debt.remaining.toString());
    setShowPaymentModal(true);
  };

  const totalAmount = debts.reduce((sum, d) => sum + d.amount, 0);
  const totalPaid = debts.reduce((sum, d) => sum + d.amountPaid, 0);
  const totalRemaining = debts.reduce((sum, d) => sum + d.remaining, 0);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative transition-colors duration-300">
      <div className="pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8 pb-0 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 sm:gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-slate-100">{t.debts}</h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              {activeTab === 'payable' ? t.payablesYouOwe : t.receivablesYouOwn}
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="h-11 px-6 rounded-xl bg-gradient-brand text-white flex items-center gap-2 shadow-lg shadow-orange-200 dark:shadow-none active:scale-95 hover:bg-gradient-brand-dark transition-all font-semibold text-sm self-start sm:self-auto"
          >
            <Plus size={18} />
            {t.addDebt}
          </button>
        </div>

        <div className="mt-4 sm:mt-6 flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('payable')}
            className={cn(
              "px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-semibold text-xs sm:text-sm transition-all whitespace-nowrap",
              activeTab === 'payable'
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-lg"
                : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
            )}
          >
            {t.payable}
          </button>
          <button
            onClick={() => setActiveTab('receivable')}
            className={cn(
              "px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-semibold text-xs sm:text-sm transition-all whitespace-nowrap",
              activeTab === 'receivable'
                ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-lg"
                : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
            )}
          >
            {t.receivable}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-4 px-4 sm:px-6 lg:px-8 pb-8 no-scrollbar">
        <div className="max-w-7xl mx-auto pb-32">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <DollarSign size={16} className="text-slate-500" />
                </div>
                <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">{t.amount}</span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                  <CheckCircle size={16} className="text-emerald-500" />
                </div>
                <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">{t.paid}</span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(totalPaid)}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl sm:rounded-2xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                  <Clock size={16} className="text-amber-500" />
                </div>
                <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">{t.remaining}</span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">{formatCurrency(totalRemaining)}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            <div className="p-4 sm:p-6 border-b border-slate-50 dark:border-slate-800">
              <div className="relative max-w-full sm:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder={t.searchDebt || (lang === 'en' ? 'Search by name...' : 'Tafuta kwa jina...')}
                  className="w-full h-11 pl-11 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/20 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {debtsLoading ? (
              <div className="flex items-center justify-center py-20">
                <LoadingSpinner size={48} thickness={200} speed={75} color="#f97316" secondaryColor="rgba(249, 115, 22, 0.3)" />
              </div>
            ) : filteredDebts.length === 0 ? (
              <div className="py-12 sm:py-20 text-center">
                <div className="inline-flex p-6 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-300 dark:text-slate-700 mb-4">
                  <CreditCard size={36} />
                </div>
                <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-xs">
                  {t.noDebts}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto no-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-50 dark:border-slate-800">
                        <th className="py-4 sm:py-6 px-4 sm:px-8 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                          {activeTab === 'payable' ? t.supplierName : t.customerName}
                        </th>
                        <th className="py-4 sm:py-6 px-3 sm:px-6 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right hidden md:table-cell">{t.amount}</th>
                        <th className="py-4 sm:py-6 px-3 sm:px-6 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right hidden md:table-cell">{t.paidAmount}</th>
                        <th className="py-4 sm:py-6 px-3 sm:px-6 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">{t.remaining}</th>
                        <th className="py-4 sm:py-6 px-3 sm:px-6 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden lg:table-cell">{t.dueDate}</th>
                        <th className="py-4 sm:py-6 px-3 sm:px-6 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">{t.status}</th>
                        <th className="py-4 sm:py-6 px-4 sm:px-8 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">{t.action}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {filteredDebts.map((debt) => {
                        const daysInfo = getDaysInfo(debt.dueDate);
                        const statusInfo = getStatusBadge(debt.status);
                        const StatusIcon = statusInfo.icon;
                        return (
                          <tr key={debt.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="py-4 sm:py-5 px-4 sm:px-8">
                              <div className="flex items-center gap-3 sm:gap-4">
                                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-brand-primary border border-orange-100 dark:border-orange-900">
                                  <User size={18} />
                                </div>
                                <div className="min-w-0">
                                  <span className="font-bold text-slate-900 dark:text-slate-100 block text-sm sm:text-base truncate">
                                    {activeTab === 'payable' ? debt.supplierName : debt.customer?.name || '-'}
                                  </span>
                                  {activeTab === 'receivable' && debt.customer?.phone && (
                                    <span className="text-xs text-slate-400 dark:text-slate-500 truncate">{debt.customer.phone}</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 sm:py-5 px-3 sm:px-6 text-right font-bold text-slate-900 dark:text-slate-100 hidden md:table-cell tabular-nums">
                              {formatCurrency(debt.amount)}
                            </td>
                            <td className="py-4 sm:py-5 px-3 sm:px-6 text-right font-bold text-emerald-600 dark:text-emerald-400 hidden md:table-cell tabular-nums">
                              {formatCurrency(debt.amountPaid)}
                            </td>
                            <td className="py-4 sm:py-5 px-3 sm:px-6 text-right font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                              {formatCurrency(debt.remaining)}
                            </td>
                            <td className="py-4 sm:py-5 px-3 sm:px-6 hidden lg:table-cell">
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <Calendar size={12} className="text-slate-400 shrink-0" />
                                <div className="text-xs sm:text-sm">
                                  <span className="font-medium text-slate-600 dark:text-slate-400">
                                    {new Date(debt.dueDate).toLocaleDateString()}
                                  </span>
                                  {debt.status !== 'paid' && (
                                    <span className={cn(
                                      "ml-1 sm:ml-2 text-[10px] font-black uppercase tracking-widest",
                                      daysInfo < 0 ? "text-rose-500" : "text-slate-400"
                                    )}>
                                      {daysInfo < 0 ? `${Math.abs(daysInfo)} ${t.daysOverdue}` : `${daysInfo} ${t.daysLeft}`}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 sm:py-5 px-3 sm:px-6 text-center">
                              <span className={cn(
                                "px-2 sm:px-4 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-1 sm:gap-1.5 mx-auto w-fit",
                                statusInfo.class
                              )}>
                                <StatusIcon size={10} />
                                <span className="hidden xs:inline">{t[debt.status as keyof typeof t] || debt.status}</span>
                              </span>
                            </td>
                            <td className="py-4 sm:py-5 px-4 sm:px-8">
                              <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                                {debt.remaining > 0 && (
                                  <button
                                    onClick={() => openPaymentModal(debt)}
                                    className="h-9 sm:h-10 px-3 sm:px-4 flex items-center gap-1.5 sm:gap-2 bg-gradient-brand text-white rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-gradient-brand-dark transition-all"
                                  >
                                    <ArrowRightLeft size={12} />
                                    <span className="hidden xs:inline">{t.recordPayment}</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="sm:hidden divide-y divide-slate-50 dark:divide-slate-800">
                  {filteredDebts.map((debt) => {
                    const daysInfo = getDaysInfo(debt.dueDate);
                    const statusInfo = getStatusBadge(debt.status);
                    const StatusIcon = statusInfo.icon;
                    return (
                      <div key={debt.id} className="p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="h-10 w-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-brand-primary border border-orange-100 dark:border-orange-900 shrink-0">
                            <User size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                              {activeTab === 'payable' ? debt.supplierName : debt.customer?.name || '-'}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1 w-fit",
                                statusInfo.class
                              )}>
                                <StatusIcon size={8} />
                                {t[debt.status as keyof typeof t] || debt.status}
                              </span>
                              {debt.status !== 'paid' && (
                                <span className={cn("text-[9px] font-bold", daysInfo < 0 ? "text-rose-500" : "text-slate-400")}>
                                  {daysInfo < 0 ? `${Math.abs(daysInfo)}d overdue` : `${daysInfo}d left`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pl-13">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-slate-500">{t.amount}:</span>
                              <span className="font-bold text-slate-900">{formatCurrency(debt.amount)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-slate-500">{t.remaining}:</span>
                              <span className="font-bold text-amber-600">{formatCurrency(debt.remaining)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400">
                              <Calendar size={10} />
                              {new Date(debt.dueDate).toLocaleDateString()}
                            </div>
                          </div>
                          {debt.remaining > 0 && (
                            <button
                              onClick={() => openPaymentModal(debt)}
                              className="h-9 px-3 flex items-center gap-1.5 bg-gradient-brand text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-gradient-brand-dark transition-all"
                            >
                              <ArrowRightLeft size={12} />
                              Pay
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
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
                    <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100">{t.addDebt}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {activeTab === 'payable' ? t.payablesYouOwe : t.receivablesYouOwn}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl text-slate-400 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                  {activeTab === 'receivable' ? (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {t.selectCustomer} *
                      </label>
                      <select
                        className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/30 transition-all text-slate-800 dark:text-slate-100 text-base outline-none appearance-none"
                        value={formData.customerId}
                        onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                      >
                        <option value="">{lang === 'en' ? 'Select a customer...' : 'Chagua mteja...'}</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        {t.supplierName} *
                      </label>
                      <input
                        type="text"
                        className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/30 transition-all text-slate-800 dark:text-slate-100 text-base outline-none"
                        placeholder={lang === 'en' ? 'Enter supplier name' : 'Ingiza jina la msambazaji'}
                        value={formData.supplierName}
                        onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {t.amount} *
                    </label>
                    <input
                      type="number"
                      className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/30 transition-all text-slate-800 dark:text-slate-100 text-base outline-none"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {t.dueDate}
                    </label>
                    <input
                      type="date"
                      className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/30 transition-all text-slate-800 dark:text-slate-100 text-base outline-none"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {t.description}
                    </label>
                    <textarea
                      className="w-full h-24 px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/30 transition-all text-slate-800 dark:text-slate-100 text-base outline-none resize-none"
                      placeholder={lang === 'en' ? 'Add notes (optional)' : 'Ongeza maelezo (hiari)'}
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
                    onClick={handleAddDebt}
                    className="flex-[2] h-14 bg-brand-primary text-white font-semibold text-sm rounded-2xl shadow-xl shadow-orange-100 dark:shadow-none hover:bg-orange-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    {t.addDebt}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPaymentModal && selectedDebt && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaymentModal(false)}
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
                    <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100">{t.recordPayment}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {activeTab === 'payable' ? selectedDebt.supplierName : selectedDebt.customer?.name}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl text-slate-400 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.amount}</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(selectedDebt.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.paidAmount}</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(selectedDebt.amountPaid)}</span>
                  </div>
                  <div className="h-px bg-slate-200 dark:bg-slate-700" />
                  <div className="flex justify-between">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{t.remaining}</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">{formatCurrency(selectedDebt.remaining)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {t.amount} *
                    </label>
                    <input
                      type="number"
                      className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/30 transition-all text-slate-800 dark:text-slate-100 text-base outline-none"
                      placeholder="0.00"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      max={selectedDebt.remaining}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setPaymentAmount((selectedDebt.remaining / 2).toFixed(2))}
                        className="flex-1 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                      >
                        {t.partialPayment}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentAmount(selectedDebt.remaining.toString())}
                        className="flex-1 h-10 rounded-xl bg-brand-primary text-white text-xs font-semibold hover:bg-orange-600 transition-all"
                      >
                        {t.fullPayment}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {t.paymentNotes}
                    </label>
                    <textarea
                      className="w-full h-32 px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/30 transition-all text-slate-800 dark:text-slate-100 text-base outline-none resize-none"
                      placeholder={lang === 'en' ? 'Add payment notes (optional)' : 'Ongeza maelezo ya malipo (hiari)'}
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex gap-3">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={handleRecordPayment}
                    className="flex-[2] h-14 bg-brand-primary text-white font-semibold text-sm rounded-2xl shadow-xl shadow-orange-100 dark:shadow-none hover:bg-orange-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    {t.recordPayment}
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