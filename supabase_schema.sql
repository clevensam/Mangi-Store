-- Create admin_users table for backend authentication
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT DEFAULT 'owner' CHECK (role IN ('owner', 'staff')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create profiles table (for additional user data)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  buying_price NUMERIC,
  selling_price NUMERIC,
  quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create debts table
CREATE TABLE IF NOT EXISTS debts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('payable', 'receivable')),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  supplier_name TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create debt_payments table
CREATE TABLE IF NOT EXISTS debt_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  debt_id UUID REFERENCES debts(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  notes TEXT
);

-- Set up Row Level Security (RLS)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;

-- Policies for admin_users (managed by backend, so allow all for now)
CREATE POLICY "Allow all operations on admin_users" ON admin_users
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for profiles
CREATE POLICY "Allow all operations on profiles" ON profiles
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for customers
CREATE POLICY "Allow all operations on customers" ON customers
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for products (managed by backend)
CREATE POLICY "Allow all operations on products" ON products
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for sales (managed by backend)
CREATE POLICY "Allow all operations on sales" ON sales
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for debts
CREATE POLICY "Allow all operations on debts" ON debts
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for debt_payments
CREATE POLICY "Allow all operations on debt_payments" ON debt_payments
  FOR ALL USING (true) WITH CHECK (true);

-- Create operating_expenses table
CREATE TABLE IF NOT EXISTS operating_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  expense_date DATE NOT NULL,
  status TEXT DEFAULT 'paid' CHECK (status IN ('paid', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up RLS for operating_expenses
ALTER TABLE operating_expenses ENABLE ROW LEVEL SECURITY;

-- Policies for operating_expenses
CREATE POLICY "Allow all operations on operating_expenses" ON operating_expenses
  FOR ALL USING (true) WITH CHECK (true);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_debts_type ON debts(type);
CREATE INDEX IF NOT EXISTS idx_debts_customer_id ON debts(customer_id);
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
CREATE INDEX IF NOT EXISTS idx_debts_due_date ON debts(due_date);
CREATE INDEX IF NOT EXISTS idx_debt_payments_debt_id ON debt_payments(debt_id);
CREATE INDEX IF NOT EXISTS idx_operating_expenses_category ON operating_expenses(category);
CREATE INDEX IF NOT EXISTS idx_operating_expenses_date ON operating_expenses(expense_date);