import { useQuery, useMutation, gql } from '@apollo/client';

const GET_EXPENSES = gql`
  query GetOperatingExpenses($category: String) {
    operatingExpenses(category: $category) {
      id
      category
      description
      amount
      expenseDate
      status
      createdAt
    }
    expenseTotalsByCategory {
      category
      total
    }
  }
`;

const CREATE_EXPENSE = gql`
  mutation CreateOperatingExpense($category: String!, $description: String, $amount: Float!, $expenseDate: String!, $status: String) {
    createOperatingExpense(category: $category, description: $description, amount: $amount, expenseDate: $expenseDate, status: $status) {
      id
      category
    }
  }
`;

const UPDATE_EXPENSE = gql`
  mutation UpdateOperatingExpense($id: ID!, $category: String, $description: String, $amount: Float, $expenseDate: String, $status: String) {
    updateOperatingExpense(id: $id, category: $category, description: $description, amount: $amount, expenseDate: $expenseDate, status: $status) {
      id
      category
    }
  }
`;

const DELETE_EXPENSE = gql`
  mutation DeleteOperatingExpense($id: ID!) {
    deleteOperatingExpense(id: $id)
  }
`;

export interface Expense {
  id: string;
  category: string;
  description: string | null;
  amount: number;
  expenseDate: string;
  status: string;
  createdAt: string;
}

export interface ExpenseCategoryTotal {
  category: string;
  total: number;
}

export interface UseExpensesReturn {
  expenses: Expense[];
  categoryTotals: ExpenseCategoryTotal[];
  loading: boolean;
  error: string | null;
  createExpense: (data: any) => Promise<any>;
  updateExpense: (id: string, data: any) => Promise<any>;
  deleteExpense: (id: string) => Promise<any>;
  refetch: () => void;
}

export function useExpenses(category?: string): UseExpensesReturn {
  const { data, loading, refetch } = useQuery(GET_EXPENSES, {
    variables: category ? { category } : undefined,
  });
  const [create] = useMutation(CREATE_EXPENSE);
  const [update] = useMutation(UPDATE_EXPENSE);
  const [remove] = useMutation(DELETE_EXPENSE);

  const createExpense = async (input: any) => {
    const result = await create({ variables: input });
    refetch();
    return result;
  };

  const updateExpense = async (id: string, input: any) => {
    const result = await update({ variables: { id, ...input } });
    refetch();
    return result;
  };

  const deleteExpense = async (id: string) => {
    const result = await remove({ variables: { id } });
    refetch();
    return result;
  };

  return {
    expenses: (data?.operatingExpenses as Expense[]) || [],
    categoryTotals: (data?.expenseTotalsByCategory as ExpenseCategoryTotal[]) || [],
    loading,
    error: null,
    createExpense,
    updateExpense,
    deleteExpense,
    refetch,
  };
}
