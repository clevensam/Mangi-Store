import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, ShieldCheck, RotateCcw, ArrowLeft } from 'lucide-react';
import BrandLogo from '../../Brandlogo.svg';
import BrandName from '../../Brandname.svg';
import { toast } from 'sonner';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { type Language } from '../lib/i18n';

interface Props {
  lang: Language;
}

export default function VerifyOtpPage({ lang }: Props) {
  const { verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (!email) {
      navigate('/register', { replace: true });
    }
  }, [email, navigate]);

  if (!email) return null;

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error(lang === 'en' ? 'Please enter the full 6-digit code' : 'Tafadhali ingiza msimbo kamili wa tarakimu 6');
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(email, otp);
      toast.success(lang === 'en' ? 'Email verified successfully! You can now log in.' : 'Barua pepe imethibitishwa! Sasa unaweza kuingia.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setResendCooldown(30);
    try {
      const message = await resendOtp(email);
      toast.success(message || (lang === 'en' ? 'Verification code resent!' : 'Msimbo umetumwa tena!'));
    } catch (error: any) {
      toast.error(error.message);
      setResendCooldown(0);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-slate-950">
      {/* Left Panel - Branding */}
      <div className="relative w-full lg:w-[45%] min-h-[45vh] lg:min-h-screen bg-gradient-to-br from-[#f97316] via-[#ea580c] to-[#c2410c] overflow-hidden flex-col items-center justify-center p-8 lg:p-12 hidden lg:flex">
        <div className="absolute inset-0">
          <div className="absolute top-[10%] left-[10%] w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse" />
          <div className="absolute bottom-[20%] right-[10%] w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-[40%] right-[20%] w-24 h-24 bg-white/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

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
              ? 'One more step to get started'
              : 'Hatua moja zaidi kuanza'}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex items-center justify-center gap-2 text-white/70 text-sm"
          >
            <ShieldCheck size={16} />
            <span>{lang === 'en' ? 'Verify your email address' : 'Thibitisha barua pepe yako'}</span>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - OTP Verification Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-slate-50 dark:bg-slate-950">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-800">
            <div className="flex flex-col items-center mb-8">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/40 dark:to-orange-900/30 flex items-center justify-center mb-4 ring-1 ring-orange-200/50 dark:ring-orange-800/30">
                <Mail className="text-brand-primary" size={28} />
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">
                {lang === 'en' ? 'Check Your Email' : 'Angalia Barua Pepe Yako'}
              </h2>
              <p className="text-slate-400 dark:text-slate-500 text-sm font-medium text-center">
                {lang === 'en' ? 'We sent a verification code to' : 'Tumetuma msimbo wa uthibitisho kwa'}
              </p>
              <p className="text-brand-primary font-bold text-sm mt-1">{email}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-4">
                  {lang === 'en' ? 'Verification Code' : 'Msimbo wa Uthibitisho'}
                </label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    required
                    autoComplete="one-time-code"
                    placeholder="000000"
                    value={otp}
                    onChange={handleOtpChange}
                    className="w-full h-14 pl-12 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/20 transition-all text-sm tracking-[8px] text-center text-2xl"
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium ml-4 mt-1">
                  {lang === 'en' ? 'Enter the 6-digit code sent to your email' : 'Ingiza msimbo wa tarakimu 6 uliotumwa kwa barua pepe yako'}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full h-14 bg-brand-primary text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-orange-200 dark:shadow-none hover:bg-orange-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
              >
                {loading ? (
                  <LoadingSpinner size={24} thickness={200} speed={75} color="#ffffff" secondaryColor="rgba(255, 255, 255, 0.3)" />
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    {lang === 'en' ? 'Verify Email' : 'Thibitisha Barua Pepe'}
                  </>
                )}
              </button>
            </form>

            {/* Resend & Back to Login */}
            <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-800 space-y-4">
              <div className="text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {lang === 'en' ? "Didn't receive the code?" : 'Hukupata msimbo?'}
                </p>
                <button
                  type="button"
                  disabled={resendCooldown > 0}
                  onClick={handleResend}
                  className="inline-flex items-center gap-1.5 mt-1 text-brand-primary font-semibold hover:text-orange-600 transition-colors disabled:text-slate-300 dark:disabled:text-slate-600 text-sm"
                >
                  <RotateCcw size={14} className={resendCooldown > 0 ? 'animate-spin' : ''} />
                  {resendCooldown > 0
                    ? (lang === 'en' ? `Resend in ${resendCooldown}s` : `Tuma tena baada ya ${resendCooldown}s`)
                    : (lang === 'en' ? 'Resend code' : 'Tuma msimbo tena')}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors font-medium"
                >
                  <ArrowLeft size={14} />
                  {lang === 'en' ? 'Back to login' : 'Rudi kwenye kuingia'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
