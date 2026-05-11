-- ============================================================================
-- MANGI STORE - NORMALIZED DATABASE SCHEMA (Supabase Auth)
-- ============================================================================

-- ============================================================================
-- AUTHENTICATION (managed by Supabase Auth via auth.users)
-- ============================================================================

-- User profiles (linked to auth.users — managed by Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT NOT NULL,
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'staff')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Business settings (one per owner)
CREATE TABLE business_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT,
  currency TEXT DEFAULT 'TZS',
  low_stock_default INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(owner_id)
);

-- Staff relationships (owners can have multiple staff)
CREATE TABLE staff_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(owner_id, staff_user_id)
);

-- ============================================================================
-- BUSINESS ENTITIES (with owner_id for multi-tenancy)
-- ============================================================================

-- Customers table
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Products/Inventory table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  buying_price NUMERIC(12,2),
  selling_price NUMERIC(12,2),
  quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Sales transactions
CREATE TABLE sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  total_price NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Debts (payable and receivable)
CREATE TABLE debts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('payable', 'receivable')),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  supplier_name TEXT,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Debt payments
CREATE TABLE debt_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  notes TEXT
);

-- Operating expenses
CREATE TABLE operating_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  expense_date DATE NOT NULL,
  status TEXT DEFAULT 'paid' CHECK (status IN ('paid', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- PERMISSIONS (anon/authenticated roles need table access)
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Note: Backend enforces multi-tenancy at the application layer via owner_id filtering.
-- RLS provides defense-in-depth. All tables filter by auth.uid().

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE operating_expenses ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only see their own
CREATE POLICY "users_own_profiles" ON profiles
  FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Business settings: owners can only access their own
CREATE POLICY "owners_own_settings" ON business_settings
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- Staff: owners see their staff, staff see their owner
CREATE POLICY "staff_access" ON staff_members
  FOR ALL USING (owner_id = auth.uid() OR staff_user_id = auth.uid());

-- All business tables: filter by owner_id
CREATE POLICY "owners_own_customers" ON customers
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owners_own_products" ON products
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owners_own_sales" ON sales
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owners_own_debts" ON debts
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owners_own_debt_payments" ON debt_payments
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owners_own_expenses" ON operating_expenses
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- ============================================================================
-- INDEXES (for query performance)
-- ============================================================================

-- Profiles
CREATE INDEX idx_profiles_email ON profiles(email);

-- Customers
CREATE INDEX idx_customers_owner ON customers(owner_id);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_status ON customers(status);

-- Products
CREATE INDEX idx_products_owner ON products(owner_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_name ON products(name);

-- Sales
CREATE INDEX idx_sales_owner ON sales(owner_id);
CREATE INDEX idx_sales_product ON sales(product_id);
CREATE INDEX idx_sales_date ON sales(created_at);

-- Debts
CREATE INDEX idx_debts_owner ON debts(owner_id);
CREATE INDEX idx_debts_customer ON debts(customer_id);
CREATE INDEX idx_debts_type ON debts(type);
CREATE INDEX idx_debts_status ON debts(status);
CREATE INDEX idx_debts_due_date ON debts(due_date);

-- Debt payments
CREATE INDEX idx_debt_payments_owner ON debt_payments(owner_id);
CREATE INDEX idx_debt_payments_debt ON debt_payments(debt_id);

-- Operating expenses
CREATE INDEX idx_expenses_owner ON operating_expenses(owner_id);
CREATE INDEX idx_expenses_category ON operating_expenses(category);
CREATE INDEX idx_expenses_date ON operating_expenses(expense_date);
