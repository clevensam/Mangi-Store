import React, { createContext, useContext, useEffect, useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
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

const RESEND_OTP_MUTATION = gql`
  mutation ResendOtp($email: String!) {
    resendOtp(email: $email) {
      message
    }
  }
`;

const VERIFY_OTP_MUTATION = gql`
  mutation VerifyOtp($email: String!, $otp: String!) {
    verifyOtp(email: $email, otp: $otp) {
      success
      message
    }
  }
`;

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'owner' | 'manager' | 'cashier';
  status: 'active' | 'inactive' | 'pending';
}

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  role: string;
  can: (...roles: string[]) => boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<string>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  resendOtp: (email: string) => Promise<string>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  role: '',
  can: () => false,
  login: async () => {},
  register: async () => '',
  verifyOtp: async () => {},
  resendOtp: async () => '',
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [getMe] = useLazyQuery(ME_QUERY, {
    client,
    fetchPolicy: 'network-only',
  });

  const [loginMutation] = useMutation(LOGIN_MUTATION, { client });
  const [registerMutation] = useMutation(REGISTER_MUTATION, { client });
  const [resendOtpMutation] = useMutation(RESEND_OTP_MUTATION, { client });
  const [verifyOtpMutation] = useMutation(VERIFY_OTP_MUTATION, { client });

  useEffect(() => {
    const checkUser = async () => {
      try {
        const tokenMatch = localStorage.getItem('auth_token');
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
      localStorage.setItem('auth_token', data.login.token);
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

  const register = async (email: string, password: string, displayName: string): Promise<string> => {
    const { data } = await registerMutation({
      variables: { email, password, displayName },
      context: { credentials: 'include' }
    });

    if (data?.register) {
      localStorage.setItem('auth_token', data.register.token);
      setUser({ id: data.register.user.id, email: data.register.user.email });
      setProfile({
        uid: data.register.user.id,
        email: data.register.user.email,
        displayName: data.register.user.displayName,
        role: data.register.user.role,
        status: data.register.user.status
      });
      return 'Account created successfully!';
    }
    return '';
  };

  const verifyOtp = async (email: string, otp: string) => {
    const { data } = await verifyOtpMutation({
      variables: { email, otp },
      context: { credentials: 'include' }
    });

    if (!data?.verifyOtp) {
      throw new Error('Verification failed');
    }
  };

  const resendOtp = async (email: string): Promise<string> => {
    const { data } = await resendOtpMutation({
      variables: { email },
      context: { credentials: 'include' }
    });

    if (data?.resendOtp) {
      return data.resendOtp.message;
    }
    return '';
  };

  const signOut = async () => {
    setUser(null);
    setProfile(null);
    localStorage.removeItem('auth_token');
  };

  const value = {
    user,
    profile,
    loading,
    role: profile?.role || '',
    can: (...roles: string[]) => roles.includes(profile?.role || ''),
    login,
    register,
    verifyOtp,
    resendOtp,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
