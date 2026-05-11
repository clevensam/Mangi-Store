-- ============================================================================
-- MANGI STORE - SUPABASE AUTH MIGRATION
-- Run this in Supabase SQL Editor to migrate from custom auth to Supabase Auth
-- ============================================================================

-- Step 1: Grant schema usage to anon/authenticated roles
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Step 2: Create new profiles table referencing auth.users
CREATE TABLE public.profiles_new (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT NOT NULL,
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'staff')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Step 3: Drop old foreign key constraints
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

ALTER TABLE business_settings DROP CONSTRAINT IF EXISTS business_settings_owner_id_fkey;
ALTER TABLE staff_members DROP CONSTRAINT IF EXISTS staff_members_owner_id_fkey;
ALTER TABLE staff_members DROP CONSTRAINT IF EXISTS staff_members_staff_user_id_fkey;
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_owner_id_fkey;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_owner_id_fkey;
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_owner_id_fkey;
ALTER TABLE debts DROP CONSTRAINT IF EXISTS debts_owner_id_fkey;
ALTER TABLE debt_payments DROP CONSTRAINT IF EXISTS debt_payments_owner_id_fkey;
ALTER TABLE operating_expenses DROP CONSTRAINT IF EXISTS operating_expenses_owner_id_fkey;

-- Step 4: Add new foreign key constraints referencing auth.users
ALTER TABLE business_settings ADD CONSTRAINT business_settings_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE staff_members ADD CONSTRAINT staff_members_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE staff_members ADD CONSTRAINT staff_members_staff_user_id_fkey
  FOREIGN KEY (staff_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE customers ADD CONSTRAINT customers_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE products ADD CONSTRAINT products_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE sales ADD CONSTRAINT sales_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE debts ADD CONSTRAINT debts_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE debt_payments ADD CONSTRAINT debt_payments_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE operating_expenses ADD CONSTRAINT operating_expenses_owner_id_fkey
  FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 5: Grant table permissions to anon/authenticated
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Step 6: Migrate existing users to auth.users and profiles_new
-- Note: Since custom auth used bcrypt hashes, Supabase Auth cannot import them.
-- Existing users will need to reset passwords.
-- Run this only if you have existing users to migrate:
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
-- SELECT id, email, password_hash, now(), created_at, created_at FROM public.users
-- ON CONFLICT (id) DO NOTHING;
--
-- INSERT INTO public.profiles_new (id, email, display_name, role, status, created_at)
-- SELECT u.id, u.email, u.display_name, u.role, u.status, u.created_at FROM public.users u
-- ON CONFLICT (id) DO NOTHING;

-- Step 7: Migrate old profiles data
INSERT INTO public.profiles_new (id, email, display_name, role, status, created_at)
SELECT 
  u.id,
  u.email,
  u.display_name,
  u.role,
  u.status,
  u.created_at
FROM public.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
ON CONFLICT (id) DO NOTHING;

-- Step 8: Drop old tables
DROP TABLE IF EXISTS public.profiles;
ALTER TABLE public.profiles_new RENAME TO profiles;

-- Only drop users table after confirming migration is complete:
-- DROP TABLE IF EXISTS public.users;

-- Step 9: Update RLS policies for profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_own_profiles" ON profiles;
CREATE POLICY "users_own_profiles" ON profiles
  FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Step 10: Drop old indexes and recreate for profiles
DROP INDEX IF EXISTS idx_users_email;
CREATE INDEX idx_profiles_email ON profiles(email);
