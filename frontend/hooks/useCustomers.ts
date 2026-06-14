import { useQuery, useMutation, gql } from '@apollo/client';

const GET_CUSTOMERS = gql`
  query GetCustomers {
    customers {
      id
      name
      phone
      email
      address
      status
      createdAt
    }
  }
`;

const CREATE_CUSTOMER = gql`
  mutation CreateCustomer($name: String!, $phone: String, $email: String, $address: String) {
    createCustomer(name: $name, phone: $phone, email: $email, address: $address) {
      id
      name
    }
  }
`;

const UPDATE_CUSTOMER = gql`
  mutation UpdateCustomer($id: ID!, $name: String, $phone: String, $email: String, $address: String, $status: String) {
    updateCustomer(id: $id, name: $name, phone: $phone, email: $email, address: $address, status: $status) {
      id
      name
    }
  }
`;

const DELETE_CUSTOMER = gql`
  mutation DeleteCustomer($id: ID!) {
    deleteCustomer(id: $id)
  }
`;

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  status: string;
  createdAt: string;
}

export interface UseCustomersReturn {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  createCustomer: (data: Partial<Customer>) => Promise<any>;
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<any>;
  deleteCustomer: (id: string) => Promise<any>;
  refetch: () => void;
}

export function useCustomers(): UseCustomersReturn {
  const { data, loading, refetch } = useQuery(GET_CUSTOMERS);
  const [create] = useMutation(CREATE_CUSTOMER);
  const [update] = useMutation(UPDATE_CUSTOMER);
  const [remove] = useMutation(DELETE_CUSTOMER);

  const createCustomer = async (input: Partial<Customer>) => {
    const result = await create({ variables: input });
    refetch();
    return result;
  };

  const updateCustomer = async (id: string, input: Partial<Customer>) => {
    const result = await update({ variables: { id, ...input } });
    refetch();
    return result;
  };

  const deleteCustomer = async (id: string) => {
    const result = await remove({ variables: { id } });
    refetch();
    return result;
  };

  return {
    customers: (data?.customers as Customer[]) || [],
    loading,
    error: null,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    refetch,
  };
}
