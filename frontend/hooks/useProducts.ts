import { useQuery, useMutation, gql } from '@apollo/client';

const GET_PRODUCTS = gql`
  query GetProducts {
    products {
      id
      name
      category
      buying_price
      selling_price
      quantity
      low_stock_threshold
    }
  }
`;

const CREATE_PRODUCT = gql`
  mutation CreateProduct($name: String!, $category: String!, $buying_price: Float!, $selling_price: Float!, $quantity: Int!, $low_stock_threshold: Int!) {
    createProduct(name: $name, category: $category, buying_price: $buying_price, selling_price: $selling_price, quantity: $quantity, low_stock_threshold: $low_stock_threshold) {
      id
      name
    }
  }
`;

const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: ID!, $name: String, $category: String, $buying_price: Float, $selling_price: Float, $quantity: Int, $low_stock_threshold: Int) {
    updateProduct(id: $id, name: $name, category: $category, buying_price: $buying_price, selling_price: $selling_price, quantity: $quantity, low_stock_threshold: $low_stock_threshold) {
      id
      name
    }
  }
`;

const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id)
  }
`;

export interface Product {
  id: string;
  name: string;
  category: string;
  buying_price: number;
  selling_price: number;
  quantity: number;
  low_stock_threshold: number;
}

export interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  createProduct: (data: Partial<Product>) => Promise<any>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<any>;
  deleteProduct: (id: string) => Promise<any>;
  refetch: () => void;
}

export function useProducts(): UseProductsReturn {
  const { data, loading, refetch } = useQuery(GET_PRODUCTS);
  const [create] = useMutation(CREATE_PRODUCT);
  const [update] = useMutation(UPDATE_PRODUCT);
  const [remove] = useMutation(DELETE_PRODUCT);

  const createProduct = async (input: Partial<Product>) => {
    const result = await create({ variables: input });
    refetch();
    return result;
  };

  const updateProduct = async (id: string, input: Partial<Product>) => {
    const result = await update({ variables: { id, ...input } });
    refetch();
    return result;
  };

  const deleteProduct = async (id: string) => {
    const result = await remove({ variables: { id } });
    refetch();
    return result;
  };

  return {
    products: (data?.products as Product[]) || [],
    loading,
    error: null,
    createProduct,
    updateProduct,
    deleteProduct,
    refetch,
  };
}
