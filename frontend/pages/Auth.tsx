import React, { useState } from 'react';
import { translations, type Language } from '../lib/i18n';
import { motion } from 'motion/react';
import { LogIn, Mail, Lock, User as UserIcon, ShieldCheck } from 'lucide-react';
import BrandLogo from '../../Brandlogo.svg';
import BrandName from '../../Brandname.svg';
import { toast } from 'sonner';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  lang: Language;
  mode?: 'login' | 'register';
}

export default function AuthPage({ lang, mode = 'login' }: Props) {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(mode === 'register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password, displayName);
        toast.success(lang === 'en' ? 'Account created successfully!' : 'Akaunti imeumbwa kikamilifu!');
      } else {
        await login(email, password);
        toast.success(lang === 'en' ? 'Welcome back!' : 'Karibu tena!');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-slate-950">
      {/* Left Panel - Branding */}
      <div className="relative w-full lg:w-[45%] min-h-[45vh] lg:min-h-screen bg-gradient-to-br from-[#f97316] via-[#ea580c] to-[#c2410c] overflow-hidden flex flex-col items-center justify-center p-8 lg:p-12">
        {/* Decorative Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-[10%] left-[10%] w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse" />
          <div className="absolute bottom-[20%] right-[10%] w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-[40%] right-[20%] w-24 h-24 bg-white/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        {/* Brand Content */}
        <div className="relative z-10 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-4"
          >
            <img src={BrandLogo} alt="Mangi" className="h-32 w-32 mx-auto object-contain drop-shadow-2xl" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6"
          >
            <img src={BrandName} alt="Mangi Store" className="h-10 mx-auto object-contain" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-white/90 text-lg lg:text-xl font-medium max-w-sm mx-auto leading-relaxed"
          >
            {lang === 'en' 
              ? 'Modern Point-of-Sale System for Smart Retail Businesses' 
              : 'Mfumo wa Kisasa wa Mauzo kwa Biashara Smart'}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 space-y-3"
          >
            {[
              lang === 'en' ? 'Real-time Inventory Tracking' : 'Kufuatilia Stock ya Wakati Halisi',
              lang === 'en' ? 'Sales Analytics & Reports' : 'Ripoti na Uchambuzi ya Mauzo',
              lang === 'en' ? 'Customer & Debt Management' : 'Usimamizi wa Wateja na Madeni'
            ].map((feature, i) => (
              <div key={i} className="flex items-center justify-center gap-2 text-white/80 text-sm">
                <span>•</span>
                <span>{feature}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-slate-50 dark:bg-slate-950">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Mobile Brand Header */}
          <div className="lg:hidden text-center mb-8">
            <img src={BrandLogo} alt="Mangi" className="h-16 w-16 mx-auto object-contain mb-2" />
            <img src={BrandName} alt="Mangi Store" className="h-6 mx-auto object-contain" />
          </div>

          {/* Card - Same design as before */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-800">
            <div className="flex flex-col items-center mb-8">
              <img src={BrandLogo} alt="Mangi" className="h-16 w-16 object-contain mb-3" />
              <img src={BrandName} alt="Mangi Store" className="h-6 object-contain mb-2" />
              <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">
                {isRegister 
                  ? (lang === 'en' ? 'Start your business journey' : 'Anza safari yako ya biashara')
                  : (lang === 'en' ? 'Access your retail intelligence' : 'Fikia akili yako ya biashara')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {isRegister && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4">
                    {lang === 'en' ? 'Business Name' : 'Jina la Biashara'}
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      required={isRegister}
                      className="w-full h-14 pl-12 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/20 transition-all text-sm"
                      placeholder="Salama Shop"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4">
                  {lang === 'en' ? 'Email Address' : 'Barua Pepe'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="email" 
                    required
                    className="w-full h-14 pl-12 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/20 transition-all text-sm"
                    placeholder="salama@duka.co"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4">
                  {lang === 'en' ? 'Password' : 'Nenosiri'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="password" 
                    required
                    className="w-full h-14 pl-12 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/20 transition-all text-sm"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-orange-200 dark:shadow-none hover:bg-orange-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {loading ? (
                  <LoadingSpinner size={24} thickness={200} speed={75} color="#ffffff" secondaryColor="rgba(255, 255, 255, 0.3)" />
                ) : (
                  <>
                    {isRegister ? <ShieldCheck size={18} /> : <LogIn size={18} />}
                    {isRegister ? (lang === 'en' ? 'Create Account' : 'Fungua Akaunti') : (lang === 'en' ? 'Log In' : 'Ingia')}
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-800 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isRegister 
                  ? (lang === 'en' ? 'Already have an account?' : 'Tayari una akaunti?')
                  : (lang === 'en' ? "Don't have an account?" : 'Huna akaunti?')}
                <button 
                  type="button"
                  onClick={() => { setIsRegister(!isRegister); setEmail(''); setPassword(''); setDisplayName(''); }}
                  className="ml-1 text-brand-primary font-semibold hover:text-orange-600 transition-colors"
                >
                  {isRegister 
                    ? (lang === 'en' ? 'Sign in' : 'Ingia')
                    : (lang === 'en' ? 'Create account' : 'Fungua akaunti')}
                </button>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}