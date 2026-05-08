import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getUserProfile, UserProfile } from '../lib/auth';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isOwner: boolean;
  isGuest: boolean;
  loginAsDemo: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isOwner: false,
  isGuest: false,
  loginAsDemo: () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    // Check active sessions and subscribe to auth changes
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          const userProfile = await getUserProfile(session.user.id);
          setProfile(userProfile);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isDemo) {
        const currentUser = session?.user || null;
        setUser(currentUser);
        
        if (currentUser) {
          const userProfile = await getUserProfile(currentUser.id);
          setProfile(userProfile);
        } else {
          setProfile(null);
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [isDemo]);

  const loginAsDemo = () => {
    setIsDemo(true);
    setLoading(false);
  };

  const signOut = async () => {
    if (isDemo) {
      setIsDemo(false);
      setUser(null);
      setProfile(null);
    } else {
      await supabase.auth.signOut();
    }
  };

  const value = {
    user: isDemo ? ({ 
      id: 'demo-user', 
      email: 'demo@duka.smart',
      role: 'authenticated',
      aud: 'authenticated',
    } as any) : user,
    profile: isDemo ? ({ uid: 'demo-user', email: 'demo@duka.smart', displayName: 'Demo Manager', role: 'owner', status: 'active' } as any) : profile,
    loading: loading && !isDemo,
    isOwner: isDemo || profile?.role === 'owner',
    isGuest: isDemo,
    loginAsDemo,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {loading && !isDemo ? (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
          <div className="h-10 w-10 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
