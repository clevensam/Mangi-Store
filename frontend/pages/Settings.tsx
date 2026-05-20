import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { toast } from 'sonner';
import { translations, type Language } from '../lib/i18n';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { User, Shield, Mail, CheckCircle, Users, Plus, X, Save, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

interface SettingsRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  badge?: React.ReactNode;
}

function SettingsRow({ icon, label, value, badge }: SettingsRowProps) {
  return (
    <div className="flex items-center justify-between py-4 px-4 -mx-4 border-b border-slate-100 dark:border-slate-800 last:border-b-0">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400">
          {icon}
        </div>
        <span className="text-[15px] font-medium text-slate-700 dark:text-slate-200">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {value && <span className="text-[15px] text-slate-500 dark:text-slate-400">{value}</span>}
        {badge}
      </div>
    </div>
  );
}

function SettingsSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-[0_2px_20px_rgba(0,0,0,0.06)] dark:shadow-none overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300">
            {icon}
          </div>
          <span className="text-[13px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{title}</span>
        </div>
      </div>
      <div className="px-2 pb-2">
        {children}
      </div>
    </div>
  );
}

export default function SettingsPage({ lang }: { lang: Language }) {
  const t = translations[lang];
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

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(lang === 'sw' ? 'sw-TZ' : 'en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-50" />
        <div className="hidden lg:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-orange-50 to-amber-50 rounded-full blur-3xl opacity-30" />
      </div>

      {/* Main container */}
      <div className="flex-1 py-4 sm:py-6 px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
        {/* Header */}
        <div className="max-w-6xl mx-auto mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900">
            {t.settings}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {lang === 'en' ? 'Manage your account and preferences' : 'Simamia akaunti na upendeleo wako'}
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          
          {/* Profile Header */}
          <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500 rounded-[2rem] shadow-2xl shadow-orange-200/50 dark:shadow-none overflow-hidden mb-8">
            <div className="relative">
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-slate-50 dark:bg-slate-950" style={{ borderTopLeftRadius: '50% 100%', borderTopRightRadius: '50% 100%' }} />
              
              <div className="pt-10 pb-8 px-6 sm:px-8 lg:px-10 flex flex-col sm:flex-row items-center gap-6">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl sm:text-4xl font-black text-white border-4 border-white/30 shadow-lg shrink-0">
                  {getInitials(profile?.displayName || 'User')}
                </div>
                
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{profile?.displayName || 'User'}</h1>
                  <p className="text-white/80 font-medium mt-1 text-sm">{profile?.email || 'email@example.com'}</p>
                  
                  <div className="flex items-center justify-center sm:justify-start gap-3 mt-4">
                    <span className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wider">
                      {profile?.role === 'owner' ? t.owner : profile?.role === 'manager' ? 'Manager' : 'Cashier'}
                    </span>
                    <span className={cn(
                      "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5",
                      profile?.status === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                    )}>
                      {profile?.status === 'active' && <CheckCircle size={12} />}
                      {profile?.status || 'active'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Section */}
          <div className="w-full max-w-full">
            <SettingsSection icon={<User size={18} />} title={t.accountSettings}>
              <SettingsRow 
                icon={<User size={18} />}
                label={t.yourName}
                value={profile?.displayName || '-'}
              />
              <SettingsRow 
                icon={<Mail size={18} />}
                label={t.emailAddress}
                value={profile?.email || '-'}
              />
              <SettingsRow 
                icon={<Shield size={18} />}
                label="Role"
                badge={
                  <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                    {profile?.role === 'owner' ? t.owner : profile?.role === 'manager' ? 'Manager' : 'Cashier'}
                  </span>
                }
              />
              <SettingsRow 
                icon={<CheckCircle size={18} />}
                label={t.status}
                badge={
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold uppercase",
                    profile?.status === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                  )}>
                    {profile?.status || 'active'}
                  </span>
                }
              />
            </SettingsSection>
          </div>

          {/* Staff Management Section - Owner Only */}
          {can('owner') && (
            <div className="w-full max-w-full">
              <SettingsSection icon={<Users size={18} />} title={t.staffManagement}>
                <div className="px-4 py-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      {t.staffList} ({staffMembers.length})
                    </p>
                    <button
                      onClick={() => setShowAddStaff(true)}
                      className="h-10 px-4 rounded-xl bg-brand-primary text-white flex items-center gap-2 shadow-lg shadow-orange-200 dark:shadow-none hover:bg-orange-600 transition-all font-bold text-xs uppercase tracking-wider"
                    >
                      <Plus size={16} />
                      {t.addStaff}
                    </button>
                  </div>

                  {staffLoading ? (
                    <div className="text-center py-8 text-slate-400 text-sm">
                      {lang === 'en' ? 'Loading...' : 'Inapakia...'}
                    </div>
                  ) : staffMembers.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="inline-flex p-4 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-300 dark:text-slate-700 mb-3">
                        <Users size={24} />
                      </div>
                      <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">{t.noStaff}</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {staffMembers.map((staff, index) => (
                        <div
                          key={staff.id}
                          className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 transition-all hover:border-slate-200 dark:hover:border-slate-600"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                              <User size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">{staff.displayName}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{staff.email}</span>
                                <span className="text-[10px] text-slate-300 dark:text-slate-600">·</span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatDate(staff.createdAt)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            <span className={cn(
                              "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                              staff.role === 'manager' 
                                ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400" 
                                : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300"
                            )}>
                              {staff.role === 'manager' ? t.manager : t.cashier}
                            </span>
                            <button
                              onClick={() => handleToggleStatus(staff)}
                              className={cn(
                                "p-2 rounded-lg border transition-all",
                                staff.status === 'active'
                                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/50"
                                  : "bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600"
                              )}
                              title={staff.status === 'active' ? t.inactive : t.active}
                            >
                              {staff.status === 'active' ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                            </button>
                            <button
                              onClick={() => handleDeleteStaff(staff.id)}
                              className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-400 hover:text-rose-500 hover:border-rose-200 dark:hover:border-rose-800 transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </SettingsSection>
            </div>
          )}

          {/* App version */}
          <div className="text-center mt-8 pb-4">
            <p className="text-xs text-slate-400 font-medium">Mangi POS v1.0.0</p>
          </div>

        </div>
      </div>

      {/* Add Staff Modal */}
      <AnimatePresence>
        {showAddStaff && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddStaff(false)}
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
                    <h3 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100">{t.addStaff}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {lang === 'en' ? 'Create a new staff account' : 'Unda akaunti mpya ya mfanyakazi'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddStaff(false)}
                    className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl text-slate-400 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t.staffName}</label>
                    <input
                      type="text"
                      className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/30 transition-all font-bold text-slate-800 dark:text-slate-100 text-base outline-none"
                      placeholder="John Doe"
                      value={staffForm.displayName}
                      onChange={e => setStaffForm({ ...staffForm, displayName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t.staffEmail}</label>
                    <input
                      type="email"
                      className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/30 transition-all font-bold text-slate-800 dark:text-slate-100 text-base outline-none"
                      placeholder="john@shop.co"
                      value={staffForm.email}
                      onChange={e => setStaffForm({ ...staffForm, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t.staffPassword}</label>
                    <input
                      type="password"
                      className="w-full h-14 px-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/30 transition-all font-bold text-slate-800 dark:text-slate-100 text-base outline-none"
                      placeholder="••••••••"
                      value={staffForm.password}
                      onChange={e => setStaffForm({ ...staffForm, password: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">{t.staffRole}</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setStaffForm({ ...staffForm, role: 'manager' })}
                        className={cn(
                          "px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border",
                          staffForm.role === 'manager'
                            ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-xl"
                            : "bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:border-brand-primary/30"
                        )}
                      >
                        {t.manager}
                      </button>
                      <button
                        onClick={() => setStaffForm({ ...staffForm, role: 'cashier' })}
                        className={cn(
                          "px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border",
                          staffForm.role === 'cashier'
                            ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-xl"
                            : "bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:border-brand-primary/30"
                        )}
                      >
                        {t.cashier}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex gap-3">
                  <button
                    onClick={() => setShowAddStaff(false)}
                    className="flex-1 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-[0.98]"
                  >
                    {lang === 'en' ? 'Cancel' : 'Ghairi'}
                  </button>
                  <button
                    onClick={handleCreateStaff}
                    className="flex-[2] h-14 bg-brand-primary text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-orange-100 dark:shadow-none hover:bg-orange-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <Save size={18} />
                    {t.createStaff}
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