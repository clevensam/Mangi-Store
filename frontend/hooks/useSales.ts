import { useMutation, gql } from '@apollo/client';

const RECORD_SALE = gql`
  mutation RecordSale($productId: ID!, $quantity: Int!, $totalPrice: Float!) {
    recordSale(productId: $productId, quantity: $quantity, totalPrice: $totalPrice) {
      id
    }
  }
`;

export interface UseSalesReturn {
  recordSale: (productId: string, quantity: number, totalPrice: number) => Promise<any>;
  loading: boolean;
  error: string | null;
}

export function useSales(): UseSalesReturn {
  const [record, { loading }] = useMutation(RECORD_SALE);

  const recordSale = async (productId: string, quantity: number, totalPrice: number) => {
    return record({
      variables: { productId, quantity, totalPrice },
    });
  };

  return {
    recordSale,
    loading,
    error: null,
  };
}
