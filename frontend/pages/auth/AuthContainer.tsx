import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../contexts/AuthContext';
import { AuthPresenter } from './AuthPresenter';

interface AuthContainerProps {
  mode?: 'login' | 'register';
}

export function AuthContainer({ mode = 'login' }: AuthContainerProps) {
  const { lang, t } = useLanguage();
  const { login, register } = useAuth();
  const navigate = useNavigate();
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
        const message = await register(email, password, displayName);
        toast.success(message || (lang === 'en' ? 'Welcome to Mangi Store!' : 'Karibu kwenye Mangi Store!'));
        navigate('/dashboard');
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

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setEmail('');
    setPassword('');
    setDisplayName('');
  };

  return (
    <AuthPresenter
      t={t}
      lang={lang}
      isRegister={isRegister}
      email={email}
      onEmailChange={setEmail}
      password={password}
      onPasswordChange={setPassword}
      displayName={displayName}
      onDisplayNameChange={setDisplayName}
      loading={loading}
      onSubmit={handleSubmit}
      onToggleMode={toggleMode}
    />
  );
}
