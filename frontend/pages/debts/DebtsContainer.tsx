import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { toast } from 'sonner';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../contexts/AuthContext';
import { DebtsPresenter } from './DebtsPresenter';

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
  customer: { id: string; name: string; phone: string } | null;
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

export function DebtsContainer() {
  const { lang, t } = useLanguage();
  const { can } = useAuth();
  const isCashier = !can('owner', 'manager');
  const [activeTab, setActiveTab] = useState<'payable' | 'receivable'>(isCashier ? 'receivable' : 'payable');
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

  const totalAmount = debts.reduce((sum, d) => sum + d.amount, 0);
  const totalPaid = debts.reduce((sum, d) => sum + d.amountPaid, 0);
  const totalRemaining = debts.reduce((sum, d) => sum + d.remaining, 0);

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

  return (
    <DebtsPresenter
      t={t}
      lang={lang}
      activeTab={activeTab}
      onActiveTabChange={setActiveTab}
      isCashier={isCashier}
      debts={filteredDebts}
      loading={debtsLoading}
      customers={customers}
      totalAmount={totalAmount}
      totalPaid={totalPaid}
      totalRemaining={totalRemaining}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      showAddModal={showAddModal}
      onShowAddModal={setShowAddModal}
      formData={formData}
      onFormDataChange={setFormData}
      onAddDebt={handleAddDebt}
      showPaymentModal={showPaymentModal}
      onShowPaymentModal={setShowPaymentModal}
      selectedDebt={selectedDebt}
      paymentAmount={paymentAmount}
      onPaymentAmountChange={setPaymentAmount}
      paymentNotes={paymentNotes}
      onPaymentNotesChange={setPaymentNotes}
      onRecordPayment={handleRecordPayment}
      onOpenPaymentModal={openPaymentModal}
    />
  );
}
