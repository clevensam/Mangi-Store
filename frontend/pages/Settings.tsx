import React from 'react';
import { translations, type Language } from '../lib/i18n';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { User, Shield, Mail, CheckCircle } from 'lucide-react';

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
    <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] shadow-[0_2px_20px_rgba(0,0,0,0.06)] dark:shadow-none overflow-hidden">
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
  const { profile } = useAuth();

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
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
      <div className="flex-1 py-6 px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
        {/* Header */}
        <div className="max-w-6xl mx-auto mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
            {t.settings}
          </h1>
          <p className="text-slate-500 mt-1">
            {lang === 'en' ? 'Manage your account and preferences' : 'Simamia akaunti na upendeleo wako'}
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          
          {/* Profile Header - Full Width on Desktop */}
          <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-amber-500 rounded-[2rem] shadow-2xl shadow-orange-200/50 dark:shadow-none overflow-hidden mb-8">
            <div className="relative">
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-slate-50 dark:bg-slate-950" style={{ borderTopLeftRadius: '50% 100%', borderTopRightRadius: '50% 100%' }} />
              
              <div className="pt-10 pb-8 px-6 sm:px-8 lg:px-10 flex flex-col sm:flex-row items-center gap-6">
                {/* Avatar */}
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl sm:text-4xl font-black text-white border-4 border-white/30 shadow-lg shrink-0">
                  {getInitials(profile?.displayName || 'User')}
                </div>
                
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{profile?.displayName || 'User'}</h1>
                  <p className="text-white/80 font-medium mt-1 text-sm">{profile?.email || 'email@example.com'}</p>
                  
                  <div className="flex items-center justify-center sm:justify-start gap-3 mt-4">
                    <span className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wider">
                      {profile?.role || 'owner'}
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

          {/* Account Section Only */}
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
                    {profile?.role || 'owner'}
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

          {/* App version */}
          <div className="text-center mt-8 pb-4">
            <p className="text-xs text-slate-400 font-medium">Mangi POS v1.0.0</p>
          </div>

        </div>
      </div>
    </div>
  );
}