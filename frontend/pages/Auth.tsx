import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { setupOwner } from '../lib/auth';
import { translations, type Language } from '../lib/i18n';
import { motion } from 'motion/react';
import { LogIn, UserPlus, ShieldCheck, Mail, Lock, User as UserIcon, Zap, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  lang: Language;
}

export default function AuthPage({ lang }: Props) {
  const { loginAsDemo } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const t = translations[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success(lang === 'en' ? 'Welcome back!' : 'Karibu tena!');
      } else {
        await setupOwner(email, password, displayName);
        toast.success(lang === 'en' ? 'Account created successfully! Please check your email for verification.' : 'Akaunti imeumbwa kikamilifu! Tafadhali kagua barua pepe yako kwa uthibitisho.');
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymous = async () => {
    console.log("Using demo mode to bypass restricted operation...");
    toast.info(lang === 'en' ? 'Starting in Demo Mode...' : 'Inaanza katika Njia ya Onyesho...');
    loginAsDemo();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-brand-primary/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-800 relative z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="h-16 w-16 bg-brand-primary rounded-2xl flex items-center justify-center shadow-lg shadow-orange-100 dark:shadow-none mb-6">
             <div className="h-8 w-8 border-4 border-white rounded-md"></div>
          </div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">DukaSmart</h2>
          <p className="text-slate-400 dark:text-slate-500 text-sm font-medium mt-2">{isLogin ? (lang === 'en' ? 'Access your retail intelligence' : 'Fikia akili yako ya biashara') : (lang === 'en' ? 'Register as business owner' : 'Jisajili kama mmiliki wa biashara')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
             <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4">{lang === 'en' ? 'Name' : 'Jina'}</label>
               <div className="relative">
                 <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                 <input 
                   type="text" 
                   required
                   className="w-full h-14 pl-12 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/20 transition-all text-sm"
                   placeholder="Salama Shop"
                   value={displayName}
                   onChange={e => setDisplayName(e.target.value)}
                 />
               </div>
             </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4">{lang === 'en' ? 'Email Address' : 'Barua Pepe'}</label>
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
            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4">{lang === 'en' ? 'Password' : 'Nenosiri'}</label>
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
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {isLogin ? <LogIn size={18} /> : <ShieldCheck size={18} />}
                {isLogin ? (lang === 'en' ? 'Log In' : 'Ingia') : (lang === 'en' ? 'Finish Setup' : 'Kamilisha Usajili')}
              </>
            )}
          </button>

          {isLogin && (
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-800"></div></div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest"><span className="bg-white dark:bg-slate-900 px-4 text-slate-400">{lang === 'en' ? 'OR' : 'AU'}</span></div>
            </div>
          )}

          {isLogin && (
            <button 
              type="button"
              onClick={handleAnonymous}
              disabled={loading}
              className="w-full h-14 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <Zap size={18} className="text-amber-500" />
              {lang === 'en' ? 'Quick Test / Guest Access' : 'Jaribio la Haraka / Ufikiaji wa Mgeni'}
            </button>
          )}
        </form>

        <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-800 text-center">
           <button 
             onClick={() => setIsLogin(!isLogin)}
             className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:text-brand-primary transition-colors"
           >
             {isLogin ? (lang === 'en' ? "Don't have an account? Setup Business" : 'Hauna akaunti? Anzisha Biashara') : (lang === 'en' ? 'Already have an account? Log In' : 'Tayari una akaunti? Ingia')}
           </button>
        </div>
      </motion.div>
    </div>
  );
}
