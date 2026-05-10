<div align="center">
  <img src="Brandname.svg" alt="Mangi Store" width="300" />
</div>

<div align="center">

![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=flat&logo=typescript)
![GraphQL](https://img.shields.io/badge/GraphQL-E10098?style=flat&logo=graphql)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite)

**Modern Point-of-Sale System for Retail Businesses**

[Features](#features) • [Tech Stack](#tech-stack) • [Getting Started](#getting-started) • [API](#api-reference)

</div>

---

## Overview

Mangi Store is a comprehensive, full-stack point-of-sale (POS) system designed for modern retail businesses. Built with cutting-edge technologies, it provides real-time inventory management, sales tracking, customer relationship management, and financial analytics in a single unified platform.

## Features

### Dashboard & Analytics
- Real-time sales overview with interactive charts
- Revenue tracking and performance metrics
- Low stock alerts and inventory warnings
- Daily/weekly/monthly sales trends visualization
- Key business KPIs at a glance

### Sales Management
- Fast and intuitive sales processing
- Multi-product transactions
- Real-time inventory deduction
- Sales history with detailed records
- Search and filter transactions

### Product Management
- Complete CRUD operations for products
- Category-based organization
- Buying and selling price tracking
- Stock level monitoring
- Low stock threshold alerts
- Barcode/SKU management

### Inventory & Stock
- Real-time inventory tracking
- Stock level monitoring
- Low stock alerts
- Product history and movements
- Bulk inventory updates

### Customer Management
- Customer database with contact details
- Purchase history tracking
- Customer segmentation
- Phone/email/address management
- Customer status tracking (active/inactive)

### Debt Tracking
- **Customer Debts** - Track credit sales to customers
- **Supplier Debts** - Manage payments to suppliers
- Payment recording and history
- Due date tracking
- Partial payment support
- Debt status monitoring (paid/pending/overdue)

### Expense Management
- Operating expenses tracking
- Category-based expense organization
- Monthly expense summaries
- Expense analytics by category
- Budget monitoring

### Reports & Analytics
- Comprehensive sales reports
- Revenue and profit analysis
- Expense reporting
- Debt aging reports
- Product performance metrics
- Date range filtering

### Fraud Detection
- Suspicious transaction monitoring
- Unusual pattern detection
- Anomaly alerts
- Audit trail for investigations

### Settings & Administration
- User management (staff accounts)
- Role-based access control
- System preferences
- Data export capabilities

### Authentication & Security
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access (Admin/Staff)
- Secure API endpoints
- Rate limiting protection

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript, Vite |
| **UI Framework** | Tailwind CSS, shadcn/ui |
| **State & Data** | Apollo Client, Dexie (IndexedDB) |
| **Charts** | Recharts |
| **Backend** | Express.js, Apollo Server |
| **API** | GraphQL |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | JWT, bcryptjs |
| **Localization** | i18n support |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (or local PostgreSQL)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/mangi-store.git
cd mangi-store

# Install dependencies
npm install
```

### Environment Setup

Create a `.env` file in the root directory:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Server Port
PORT=4000
```

### Running the Application

```bash
# Development mode (starts both backend & frontend)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **GraphQL API**: http://localhost:4000/graphql

---

## API Reference

### Authentication
```
POST /graphql - login(email!, password!)
POST /graphql - register(email!, password!, displayName!)
POST /graphql - createStaff(email!, password!, displayName!)
```

### Products
```
GET /graphql - products
GET /graphql - product(id)
POST /graphql - createProduct(...)
POST /graphql - updateProduct(...)
POST /graphql - deleteProduct(id)
```

### Sales
```
GET /graphql - sales
POST /graphql - recordSale(productId, quantity, totalPrice)
```

### Customers
```
GET /graphql - customers
POST /graphql - createCustomer(...)
POST /graphql - updateCustomer(...)
POST /graphql - deleteCustomer(id)
```

### Debts
```
GET /graphql - debts
GET /graphql - debtPayments(debtId)
POST /graphql - createDebt(...)
POST /graphql - recordDebtPayment(...)
POST /graphql - markDebtAsPaid(id)
```

### Expenses
```
GET /graphql - operatingExpenses
GET /graphql - expenseTotalsByCategory
GET /graphql - monthlyExpenseTotal(year, month)
POST /graphql - createOperatingExpense(...)
```

---

## Project Structure

```
mangi-store/
├── backend/
│   ├── auth/           # Authentication utilities
│   ├── graphql/        # GraphQL schema & resolvers
│   │   ├── resolvers/  # Query & mutation resolvers
│   │   └── typeDefs.ts # Type definitions
│   ├── middleware/     # Express middleware
│   ├── repositories/   # Data access layer
│   ├── services/       # Business logic
│   ├── types.ts        # TypeScript types
│   └── server.ts       # Express server entry
├── frontend/
│   ├── components/     # React components
│   │   └── ui/         # UI components (shadcn)
│   ├── contexts/       # React contexts
│   ├── lib/            # Utilities & config
│   ├── pages/          # Page components
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
├── supabase_schema.sql # Database schema
├── package.json
└── vite.config.ts
```

---

## License

MIT License - feel free to use this project for your business.

---

<div align="center">

**Built with ❤️ using modern web technologies**

</div>