import { useQuery, gql } from '@apollo/client';

const GET_DASHBOARD_DATA = gql`
  query GetDashboardData {
    dashboardData {
      stats {
        todaySales
        todayOrderCount
        lowStockCount
        inventoryValue
      }
      weeklySales {
        date
        total
      }
      topProducts {
        productId
        productName
        revenue
        quantity
      }
      recentTransactions {
        id
        productId
        productName
        quantity
        totalPrice
        createdAt
      }
      lowStockProducts {
        productId
        productName
        quantity
        threshold
        category
      }
    }
  }
`;

export interface DashboardStats {
  todaySales: number;
  todayOrderCount: number;
  lowStockCount: number;
  inventoryValue: number;
}

export interface DailySales {
  date: string;
  total: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  revenue: number;
  quantity: number;
}

export interface Transaction {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  createdAt: string;
}

export interface LowStockProduct {
  productId: string;
  productName: string;
  quantity: number;
  threshold: number;
  category: string;
}

export interface DashboardData {
  stats: DashboardStats;
  weeklySales: DailySales[];
  topProducts: TopProduct[];
  recentTransactions: Transaction[];
  lowStockProducts: LowStockProduct[];
}

export interface UseDashboardReturn {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
}

export function useDashboard(): UseDashboardReturn {
  const { data, loading } = useQuery(GET_DASHBOARD_DATA);

  return {
    data: data?.dashboardData as DashboardData ?? null,
    loading,
    error: null,
  };
}
