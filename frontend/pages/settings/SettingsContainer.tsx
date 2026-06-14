import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { toast } from 'sonner';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../contexts/AuthContext';
import { SettingsPresenter } from './SettingsPresenter';

const GET_STAFF_MEMBERS = gql`
  query GetStaffMembers {
    staffMembers {
      id
      email
      displayName
      role
      status
      createdAt
    }
  }
`;

const CREATE_STAFF = gql`
  mutation CreateStaff($email: String!, $password: String!, $displayName: String!, $role: String) {
    createStaff(email: $email, password: $password, displayName: $displayName, role: $role) {
      id
      displayName
      role
    }
  }
`;

const UPDATE_STAFF_STATUS = gql`
  mutation UpdateStaffStatus($id: ID!, $status: String!) {
    updateStaffStatus(id: $id, status: $status) {
      id
      status
    }
  }
`;

const DELETE_STAFF = gql`
  mutation DeleteStaff($id: ID!) {
    deleteStaff(id: $id)
  }
`;

interface StaffMember {
  id: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
  createdAt: string;
}

export function SettingsContainer() {
  const { lang, t } = useLanguage();
  const { profile, can } = useAuth();

  const [showAddStaff, setShowAddStaff] = useState(false);
  const [staffForm, setStaffForm] = useState({ displayName: '', email: '', password: '', role: 'cashier' });

  const { data: staffData, loading: staffLoading, refetch: refetchStaff } = useQuery(GET_STAFF_MEMBERS, {
    skip: !can('owner')
  });

  const [createStaff] = useMutation(CREATE_STAFF);
  const [updateStaffStatus] = useMutation(UPDATE_STAFF_STATUS);
  const [deleteStaff] = useMutation(DELETE_STAFF);

  const staffMembers: StaffMember[] = staffData?.staffMembers || [];

  const handleCreateStaff = async () => {
    if (!staffForm.displayName || !staffForm.email || !staffForm.password) {
      toast.error(lang === 'en' ? 'All fields are required' : 'Sehemu zote zinahitajika');
      return;
    }
    try {
      await createStaff({
        variables: {
          email: staffForm.email,
          password: staffForm.password,
          displayName: staffForm.displayName,
          role: staffForm.role
        }
      });
      toast.success(lang === 'en' ? 'Staff created successfully' : 'Mfanyakazi ameundwa kikamilifu');
      setShowAddStaff(false);
      setStaffForm({ displayName: '', email: '', password: '', role: 'cashier' });
      refetchStaff();
    } catch (err: any) {
      toast.error(err.message || (lang === 'en' ? 'Failed to create staff' : 'Imeshindwa kuunda mfanyakazi'));
    }
  };

  const handleToggleStatus = async (staff: StaffMember) => {
    const newStatus = staff.status === 'active' ? 'inactive' : 'active';
    try {
      await updateStaffStatus({ variables: { id: staff.id, status: newStatus } });
      toast.success(lang === 'en' ? `Staff ${newStatus === 'active' ? 'activated' : 'deactivated'}` : `Mfanyakazi ${newStatus === 'active' ? 'amewashwa' : 'amezimwa'}`);
      refetchStaff();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm(t.confirmDeleteStaff)) return;
    try {
      await deleteStaff({ variables: { id } });
      toast.success(lang === 'en' ? 'Staff deleted' : 'Mfanyakazi amefutwa');
      refetchStaff();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <SettingsPresenter
      t={t}
      lang={lang}
      profile={profile}
      can={can}
      staffMembers={staffMembers}
      staffLoading={staffLoading}
      showAddStaff={showAddStaff}
      onShowAddStaff={setShowAddStaff}
      staffForm={staffForm}
      onStaffFormChange={setStaffForm}
      onCreateStaff={handleCreateStaff}
      onToggleStatus={handleToggleStatus}
      onDeleteStaff={handleDeleteStaff}
    />
  );
}
