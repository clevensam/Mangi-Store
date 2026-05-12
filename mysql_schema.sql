-- ============================================================================
-- MANGI STORE - MYSQL DATABASE SCHEMA
-- Run this in your MySQL database (Railway MySQL or local)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS mangistore CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mangistore;

-- ============================================================================
-- USERS (replaces Supabase auth.users + profiles)
-- ============================================================================

CREATE TABLE profiles (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'staff')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Business settings (one per owner)
CREATE TABLE business_settings (
  id VARCHAR(36) PRIMARY KEY,
  owner_id VARCHAR(36) NOT NULL UNIQUE,
  business_name VARCHAR(255),
  currency VARCHAR(10) DEFAULT 'TZS',
  low_stock_default INT DEFAULT 5,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Staff relationships (owners can have multiple staff)
CREATE TABLE staff_members (
  id VARCHAR(36) PRIMARY KEY,
  owner_id VARCHAR(36) NOT NULL,
  staff_user_id VARCHAR(36) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY (owner_id, staff_user_id),
  FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (staff_user_id) REFERENCES profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- BUSINESS ENTITIES (with owner_id for multi-tenancy)
-- ============================================================================

-- Customers table
CREATE TABLE customers (
  id VARCHAR(36) PRIMARY KEY,
  owner_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Products/Inventory table
CREATE TABLE products (
  id VARCHAR(36) PRIMARY KEY,
  owner_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(255),
  buying_price DECIMAL(12,2),
  selling_price DECIMAL(12,2),
  quantity INT DEFAULT 0,
  low_stock_threshold INT DEFAULT 5,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Sales transactions
CREATE TABLE sales (
  id VARCHAR(36) PRIMARY KEY,
  owner_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36) NOT NULL,
  quantity INT NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Debts (payable and receivable)
CREATE TABLE debts (
  id VARCHAR(36) PRIMARY KEY,
  owner_id VARCHAR(36) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('payable', 'receivable')),
  customer_id VARCHAR(36),
  supplier_name VARCHAR(255),
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid')),
  description TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Debt payments
CREATE TABLE debt_payments (
  id VARCHAR(36) PRIMARY KEY,
  owner_id VARCHAR(36) NOT NULL,
  debt_id VARCHAR(36) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Operating expenses
CREATE TABLE operating_expenses (
  id VARCHAR(36) PRIMARY KEY,
  owner_id VARCHAR(36) NOT NULL,
  category VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  expense_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'paid' CHECK (status IN ('paid', 'pending')),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_customers_owner ON customers(owner_id);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_products_owner ON products(owner_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_sales_owner ON sales(owner_id);
CREATE INDEX idx_sales_product ON sales(product_id);
CREATE INDEX idx_sales_date ON sales(created_at);
CREATE INDEX idx_debts_owner ON debts(owner_id);
CREATE INDEX idx_debts_customer ON debts(customer_id);
CREATE INDEX idx_debts_type ON debts(type);
CREATE INDEX idx_debts_status ON debts(status);
CREATE INDEX idx_debts_due_date ON debts(due_date);
CREATE INDEX idx_debt_payments_owner ON debt_payments(owner_id);
CREATE INDEX idx_debt_payments_debt ON debt_payments(debt_id);
CREATE INDEX idx_expenses_owner ON operating_expenses(owner_id);
CREATE INDEX idx_expenses_category ON operating_expenses(category);
CREATE INDEX idx_expenses_date ON operating_expenses(expense_date);
