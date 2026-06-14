import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { toast } from 'sonner';
import { useLanguage } from '../../hooks/useLanguage';
import { CustomersPresenter } from './CustomersPresenter';

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

export function CustomersContainer() {
  const { lang, t } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', address: '', status: 'active'
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

  return (
    <CustomersPresenter
      t={t}
      lang={lang}
      customers={customers}
      filteredCustomers={filteredCustomers}
      loading={loading}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      showForm={showForm}
      editingId={editingId}
      formData={formData}
      onFormDataChange={setFormData}
      onAddNew={() => {
        setFormData({ name: '', phone: '', email: '', address: '', status: 'active' });
        setEditingId(null);
        setShowForm(true);
      }}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onSave={handleSave}
      onCloseModal={() => { setShowForm(false); setEditingId(null); }}
    />
  );
}
