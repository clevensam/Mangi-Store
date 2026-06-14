import { useQuery, useMutation, gql } from '@apollo/client';

const GET_DEBTS = gql`
  query GetDebts($type: String) {
    debts(type: $type) {
      id
      type
      customerId
      customer {
        id
        name
        phone
      }
      supplierName
      amount
      amountPaid
      remaining
      dueDate
      status
      description
      createdAt
    }
  }
`;

const GET_CUSTOMERS_FOR_DEBT = gql`
  query GetCustomersForDebt {
    customers {
      id
      name
      phone
    }
  }
`;

const CREATE_DEBT = gql`
  mutation CreateDebt($type: String!, $customerId: ID, $supplierName: String, $amount: Float!, $dueDate: String!, $description: String) {
    createDebt(type: $type, customerId: $customerId, supplierName: $supplierName, amount: $amount, dueDate: $dueDate, description: $description) {
      id
      type
    }
  }
`;

const RECORD_PAYMENT = gql`
  mutation RecordDebtPayment($debtId: ID!, $amount: Float!, $notes: String) {
    recordDebtPayment(debtId: $debtId, amount: $amount, notes: $notes) {
      id
      amountPaid
      remaining
      status
    }
  }
`;

export interface DebtCustomer {
  id: string;
  name: string;
  phone: string;
}

export interface Debt {
  id: string;
  type: string;
  customerId: string | null;
  customer: DebtCustomer | null;
  supplierName: string | null;
  amount: number;
  amountPaid: number;
  remaining: number;
  dueDate: string;
  status: string;
  description: string | null;
  createdAt: string;
}

export interface UseDebtsReturn {
  debts: Debt[];
  customers: DebtCustomer[];
  loading: boolean;
  error: string | null;
  createDebt: (data: any) => Promise<any>;
  recordPayment: (debtId: string, amount: number, notes?: string) => Promise<any>;
  refetch: () => void;
}

export function useDebts(type?: string): UseDebtsReturn {
  const { data: debtsData, loading, refetch } = useQuery(GET_DEBTS, {
    variables: type ? { type } : undefined,
  });
  const { data: customersData } = useQuery(GET_CUSTOMERS_FOR_DEBT);
  const [create] = useMutation(CREATE_DEBT);
  const [payment] = useMutation(RECORD_PAYMENT);

  const createDebt = async (input: any) => {
    const result = await create({ variables: input });
    refetch();
    return result;
  };

  const recordPayment = async (debtId: string, amount: number, notes?: string) => {
    const result = await payment({ variables: { debtId, amount, notes } });
    refetch();
    return result;
  };

  return {
    debts: (debtsData?.debts as Debt[]) || [],
    customers: (customersData?.customers as DebtCustomer[]) || [],
    loading,
    error: null,
    createDebt,
    recordPayment,
    refetch,
  };
}
