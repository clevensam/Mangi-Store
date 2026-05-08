import { supabase } from './supabase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'owner' | 'staff';
  status: 'active' | 'inactive';
}

export async function setupOwner(email: string, pass: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: pass,
    options: {
      data: {
        display_name: name,
        role: 'owner',
      }
    }
  });

  if (error) throw error;
  
  if (data.user) {
    // We can also create a profile in a 'profiles' table if we have one
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: data.user.id,
        email: email,
        display_name: name,
        role: 'owner',
        status: 'active'
      });
    
    if (profileError) {
      console.warn("Profile creation failed, but auth succeeded:", profileError);
    }
  }

  return { uid: data.user?.id, email, displayName: name };
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .single();

  if (error || !data) {
    // Fallback for session user if profile table isn't ready or user doesn't have one
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.id === uid) {
      return {
        uid: user.id,
        email: user.email || '',
        displayName: user.user_metadata?.display_name || 'Store Manager',
        role: user.user_metadata?.role || 'owner',
        status: 'active'
      };
    }
    return null;
  }

  return {
    uid: data.id,
    email: data.email,
    displayName: data.display_name,
    role: data.role,
    status: data.status
  };
}
