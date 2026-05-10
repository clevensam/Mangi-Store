import React, { useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useQuery, useMutation, gql } from '@apollo/client';
import { toast } from 'sonner';
import { translations, type Language } from '../lib/i18n';
import { formatCurrency, cn } from '../lib/utils';
import { Plus, User, Edit2, Trash2, Search, Phone, Mail, MapPin, X, Save, UserCheck, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const GET_CUSTOMERS = gql`
  query GetCustomers {
    customers {
      id
      name
      phone
      email
      address
      status
      createdAt
    }
  }
`;

const CREATE_CUSTOMER = gql`
  mutation CreateCustomer($name: String!, $phone: String, $email: String, $address: String) {
    createCustomer(name: $name, phone: $phone, email: $email, address: $address) {
      id
      name
    }
  }
`;

const UPDATE_CUSTOMER = gql`
  mutation UpdateCustomer($id: ID!, $name: String, $phone: String, $email: String, $address: String, $status: String) {
    updateCustomer(id: $id, name: $name, phone: $phone, email: $email, address: $address, status: $status) {
      id
      name
    }
  }
`;

const DELETE_CUSTOMER = gql`
  mutation DeleteCustomer($id: ID!) {
    deleteCustomer(id: $id)
  }
`;

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  status: string;
  createdAt: string;
}

interface Props {
  lang: Language;
}

export default function CustomersPage({ lang }: Props) {
  const t = translations[lang];
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    status: 'active'
  });

  const { loading, data, refetch } = useQuery(GET_CUSTOMERS);
  const [createCustomer] = useMutation(CREATE_CUSTOMER);
  const [updateCustomer] = useMutation(UPDATE_CUSTOMER);
  const [deleteCustomer] = useMutation(DELETE_CUSTOMER);

  const customers = data?.customers as Customer[] || [];

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error(lang === 'en' ? 'Customer name is required' : 'Jina la mteja linahitajika');
      return;
    }

    try {
      if (editingId) {
        await updateCustomer({
          variables: {
            id: editingId,
            name: formData.name,
            phone: formData.phone || null,
            email: formData.email || null,
            address: formData.address || null,
            status: formData.status
          }
        });
        toast.success(lang === 'en' ? 'Customer updated' : 'Mteja amesasishwa');
      } else {
        await createCustomer({
          variables: {
            name: formData.name,
            phone: formData.phone || null,
            email: formData.email || null,
            address: formData.address || null
          }
        });
        toast.success(lang === 'en' ? 'Customer added' : 'Mteja ameongezwa');
      }

      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', phone: '', email: '', address: '', status: 'active' });
      refetch();
    } catch (err: any) {
      toast.error(err.message || (lang === 'en' ? 'Failed to save customer' : 'Imeshindwa kuhifadhi mteja'));
    }
  };

  const handleEdit = (customer: Customer) => {
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      status: customer.status
    });
    setEditingId(customer.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(lang === 'en' ? 'Are you sure you want to delete this customer?' : 'Una uhakika unataka kufuta mteja huyu?')) return;

    try {
      await deleteCustomer({ variables: { id } });
      toast.success(lang === 'en' ? 'Customer deleted' : 'Mteja amefutwa');
      refetch();
    } catch (err: any) {
      toast.error(err.message || (lang === 'en' ? 'Failed to delete customer' : 'Imeshindwa kufuta mteja'));
    }
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', address: '', status: 'active' });
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative transition-colors duration-300">
      <div className="pt-8 px-8 pb-0 shrink-0">
        <div className="max-w-7xl mx-auto flex justify-between items-end">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100">{t.customers}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {lang === 'en' ? 'Manage your customer database' : 'Simamia database ya wateja wako'}
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="h-11 px-6 rounded-xl bg-gradient-brand text-white flex items-center gap-2 shadow-lg shadow-orange-200 dark:shadow-none active:scale-95 hover:bg-gradient-brand-dark transition-all font-semibold text-sm"
          >
            <Plus size={18} />
            {t.addCustomer}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-4 px-8 pb-8 no-scrollbar">
        <div className="max-w-7xl mx-auto pb-32">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            <div className="p-6 border-b border-slate-50 dark:border-slate-800">
              <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder={t.searchCustomers}
                  className="w-full h-11 pl-11 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/20 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <LoadingSpinner size={48} thickness={200} speed={75} color="#f97316" secondaryColor="rgba(249, 115, 22, 0.3)" />
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="py-20 text-center">
                <div className="inline-flex p-6 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-300 dark:text-slate-700 mb-4">
                  <User size={48} />
                </div>
                <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-xs">
                  {customers.length === 0 ? t.noCustomers : 'No customers match your search'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-50 dark:border-slate-800">
                      <th className="py-6 px-8 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.customerName}</th>
                      <th className="py-6 px-6 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.phone}</th>
                      <th className="py-6 px-6 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.email}</th>
                      <th className="py-6 px-6 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t.address}</th>
                      <th className="py-6 px-6 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">{t.status}</th>
                      <th className="py-6 px-8 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">{t.action}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {filteredCustomers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-5 px-8">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-brand-primary border border-orange-100 dark:border-orange-900">
                              <UserCheck size={22} />
                            </div>
                            <span className="font-bold text-slate-900 dark:text-slate-100">{customer.name}</span>
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <Phone size={14} />
                            <span className="text-sm font-medium">{customer.phone || '-'}</span>
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <Mail size={14} />
                            <span className="text-sm font-medium">{customer.email || '-'}</span>
                          </div>
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <MapPin size={14} />
                            <span className="text-sm font-medium">{customer.address || '-'}</span>
                          </div>
                        </td>
                        <td className="py-5 px-6 text-center">
                          <span className={cn(
                            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                            customer.status === 'active'
                              ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700"
                          )}>
                            {customer.status === 'active' ? t.active : t.inactive}
                          </span>
                        </td>
                        <td className="py-5 px-8">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(customer)}
                              className="h-10 w-10 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-400 hover:text-brand-primary hover:border-brand-primary/30 transition-all shadow-sm"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(customer.id)}
                              className="h-10 w-10 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-all shadow-sm"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="fixed inset-0 bg-slate-900/10 backdrop-blur-md z-[60]"
            />
            <div className="fixed inset-0 z-[70] overflow-y-auto pointer-events-none flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="pointer-events-auto w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 space-y-6 shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-800"
              >
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100">
                      {editingId ? t.editCustomer : t.addCustomer}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {editingId ? 'Update customer details' : 'Create a new customer record'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowForm(false)}
                    className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl text-slate-400 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {t.customerName} *
                    </label>
                    <input
                      type="text"
                      className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/30 transition-all text-slate-800 dark:text-slate-100 text-base outline-none"
                      placeholder="John Mwangi"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">{t.phone}</label>
                    <input
                      type="tel"
                      className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/30 transition-all text-slate-800 dark:text-slate-100 text-base outline-none"
                      placeholder="+254 700 123 456"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">{t.email}</label>
                    <input
                      type="email"
                      className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/30 transition-all text-slate-800 dark:text-slate-100 text-base outline-none"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">{t.address}</label>
                    <input
                      type="text"
                      className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/30 transition-all text-slate-800 dark:text-slate-100 text-base outline-none"
                      placeholder="Nairobi, Kenya"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>

                  {editingId && (
                    <div className="col-span-2 space-y-2">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">{t.status}</label>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, status: 'active' })}
                          className={cn(
                            "flex-1 h-12 rounded-xl font-semibold text-sm transition-all border",
                            formData.status === 'active'
                              ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400"
                              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500"
                          )}
                        >
                          {t.active}
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, status: 'inactive' })}
                          className={cn(
                            "flex-1 h-12 rounded-xl font-semibold text-sm transition-all border",
                            formData.status === 'inactive'
                              ? "bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100 text-white dark:text-slate-900"
                              : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500"
                          )}
                        >
                          {t.inactive}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex gap-3">
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
                  >
                    {t.cancel}
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-[2] h-14 bg-brand-primary text-white font-semibold text-sm rounded-2xl shadow-xl shadow-orange-100 dark:shadow-none hover:bg-orange-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    {editingId ? t.updateProduct : t.addToCatalog}
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