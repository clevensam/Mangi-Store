import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLazyQuery, useMutation } from '@apollo/client';
import { client } from '../lib/apollo';
import { gql } from '@apollo/client';

const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      displayName
      role
      status
    }
  }
`;

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        displayName
        role
        status
      }
    }
  }
`;

const REGISTER_MUTATION = gql`
  mutation Register($email: String!, $password: String!, $displayName: String!) {
    register(email: $email, password: $password, displayName: $displayName) {
      token
      user {
        id
        email
        displayName
        role
        status
      }
    }
  }
`;

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'owner' | 'staff';
  status: 'active' | 'inactive';
}

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  isOwner: boolean;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  loginAsDemo: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isOwner: false,
  isGuest: false,
  login: async () => {},
  register: async () => {},
  loginAsDemo: () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  const [getMe] = useLazyQuery(ME_QUERY, {
    client,
    fetchPolicy: 'network-only',
  });

  const [loginMutation] = useMutation(LOGIN_MUTATION, { client });
  const [registerMutation] = useMutation(REGISTER_MUTATION, { client });

  useEffect(() => {
    const checkUser = async () => {
      try {
        const tokenMatch = document.cookie.match(/auth_token=([^;]+)/);
        if (tokenMatch) {
          const { data } = await getMe();
          if (data?.me) {
            setUser({ id: data.me.id, email: data.me.email });
            setProfile({
              uid: data.me.id,
              email: data.me.email,
              displayName: data.me.displayName,
              role: data.me.role,
              status: data.me.status
            });
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [getMe]);

  const login = async (email: string, password: string) => {
    const { data } = await loginMutation({
      variables: { email, password },
      context: { credentials: 'include' }
    });

    if (data?.login) {
      setUser({ id: data.login.user.id, email: data.login.user.email });
      setProfile({
        uid: data.login.user.id,
        email: data.login.user.email,
        displayName: data.login.user.displayName,
        role: data.login.user.role,
        status: data.login.user.status
      });
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    const { data } = await registerMutation({
      variables: { email, password, displayName },
      context: { credentials: 'include' }
    });

    if (data?.register) {
      setUser({ id: data.register.user.id, email: data.register.user.email });
      setProfile({
        uid: data.register.user.id,
        email: data.register.user.email,
        displayName: data.register.user.displayName,
        role: data.register.user.role,
        status: data.register.user.status
      });
    }
  };

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
      try {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      } catch (e) {
        console.error('Logout error:', e);
      }
      setUser(null);
      setProfile(null);
      document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
  };

  const value = {
    user: isDemo ? ({ id: 'demo-user', email: 'demo@duka.smart' } as any) : user,
    profile: isDemo ? ({ uid: 'demo-user', email: 'demo@duka.smart', displayName: 'Demo Manager', role: 'owner' as const, status: 'active' as const } as any) : profile,
    loading: loading && !isDemo,
    isOwner: isDemo || profile?.role === 'owner',
    isGuest: isDemo,
    login,
    register,
    loginAsDemo,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {loading && !isDemo ? (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
          <div className="h-10 w-10 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};