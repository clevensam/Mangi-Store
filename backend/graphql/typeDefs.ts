export const authTypeDefs = `#graphql
  type User {
    id: ID!
    email: String!
    displayName: String!
    role: String!
    status: String!
    createdAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    me: User
  }

  type Mutation {
    login(email: String!, password: String!): AuthPayload!
    register(email: String!, password: String!, displayName: String!): AuthPayload!
    createStaff(email: String!, password: String!, displayName: String!): User!
    logout: Boolean!
  }
`;

export const customerTypeDefs = `#graphql
  type Customer {
    id: ID!
    name: String!
    phone: String
    email: String
    address: String
    status: String!
    createdAt: String!
  }

  type Query {
    customers: [Customer!]!
    customer(id: ID!): Customer
  }

  type Mutation {
    createCustomer(name: String!, phone: String, email: String, address: String): Customer!
    updateCustomer(id: ID!, name: String, phone: String, email: String, address: String, status: String): Customer
    deleteCustomer(id: ID!): Boolean!
  }
`;

export const debtTypeDefs = `#graphql
  type Debt {
    id: ID!
    type: String!
    customerId: ID
    customer: Customer
    supplierName: String
    amount: Float!
    amountPaid: Float!
    remaining: Float!
    dueDate: String!
    status: String!
    description: String
    createdAt: String!
    updatedAt: String!
  }

  type DebtPayment {
    id: ID!
    debtId: ID!
    amount: Float!
    paymentDate: String!
    notes: String
  }

  type Query {
    debts(type: String): [Debt!]!
    debt(id: ID!): Debt
    debtPayments(debtId: ID!): [DebtPayment!]!
  }

  type Mutation {
    createDebt(type: String!, customerId: ID, supplierName: String, amount: Float!, dueDate: String!, description: String): Debt!
    recordDebtPayment(debtId: ID!, amount: Float!, notes: String): Debt!
    markDebtAsPaid(id: ID!): Debt!
  }
`;

export const productTypeDefs = `#graphql
  type Product {
    id: ID!
    name: String!
    category: String!
    buying_price: Float
    selling_price: Float
    quantity: Int
    low_stock_threshold: Int
    created_at: String
  }

  type Sale {
    id: ID!
    product_id: ID!
    quantity: Int!
    total_price: Float!
    created_at: String!
  }

  type Query {
    products: [Product!]!
    sales: [Sale!]!
    product(id: ID!): Product
    productSales(productId: ID!): [Sale!]
  }

  type Mutation {
    createProduct(name: String!, category: String!, buying_price: Float!, selling_price: Float!, quantity: Int!, low_stock_threshold: Int!): Product!
    updateProduct(id: ID!, name: String, category: String, buying_price: Float, selling_price: Float, quantity: Int, low_stock_threshold: Int): Product
    deleteProduct(id: ID!): Boolean!
    recordSale(productId: ID!, quantity: Int!, totalPrice: Float!): Sale!
  }
`;

export const operatingExpenseTypeDefs = `#graphql
  type OperatingExpense {
    id: ID!
    category: String!
    description: String
    amount: Float!
    expenseDate: String!
    status: String!
    createdAt: String!
    updatedAt: String!
  }

  type ExpenseCategoryTotal {
    category: String!
    total: Float!
  }

  type Query {
    operatingExpenses(category: String): [OperatingExpense!]!
    operatingExpense(id: ID!): OperatingExpense
    expenseTotalsByCategory: [ExpenseCategoryTotal!]!
    monthlyExpenseTotal(year: Int!, month: Int!): Float!
  }

  type Mutation {
    createOperatingExpense(category: String!, description: String, amount: Float!, expenseDate: String!, status: String): OperatingExpense!
    updateOperatingExpense(id: ID!, category: String, description: String, amount: Float, expenseDate: String, status: String): OperatingExpense
    deleteOperatingExpense(id: ID!): Boolean!
  }
`;

export const typeDefs = `${authTypeDefs}\n${customerTypeDefs}\n${debtTypeDefs}\n${productTypeDefs}\n${operatingExpenseTypeDefs}`;