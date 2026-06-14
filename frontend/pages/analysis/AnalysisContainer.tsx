import React, { useState, useMemo } from 'react';
import { useQuery, gql } from '@apollo/client';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../contexts/AuthContext';
import { AnalysisPresenter } from './AnalysisPresenter';

const GET_SALES_ANALYSIS = gql`
  query GetSalesAnalysis($startDate: String, $endDate: String) {
    salesAnalysis(startDate: $startDate, endDate: $endDate) {
      totalRevenue
      totalCost
      grossProfit
      profitMargin
      transactionCount
      averageTransactionValue
    }
    deadStockAnalysis(startDate: $startDate, endDate: $endDate) {
      productId
      productName
      quantity
      category
      lastSaleDate
      daysSinceLastSale
    }
    profitabilityAnalysis(startDate: $startDate, endDate: $endDate) {
      productId
      productName
      category
      revenue
      cost
      profit
      marginPercent
      unitsSold
    }
    inventoryHealth {
      lowStock {
        productId
        productName
        category
        quantity
        threshold
      }
      overstocked {
        productId
        productName
        category
        quantity
        threshold
      }
      outOfStock {
        productId
        productName
        category
        quantity
        threshold
      }
      inventoryValue
      potentialProfit
    }
    businessInsights(startDate: $startDate, endDate: $endDate) {
      topRevenueProducts {
        productId
        productName
        category
        revenue
        profit
        marginPercent
      }
      topProfitProducts {
        productId
        productName
        category
        revenue
        profit
        marginPercent
      }
      worstMarginProducts {
        productId
        productName
        category
        revenue
        profit
        marginPercent
      }
    }
  }
`;

type PeriodType = 'week' | 'month' | '3months' | '6months';
type TabType = 'sales' | 'deadstock' | 'profitability' | 'inventory' | 'insights';

export function AnalysisContainer() {
  const { lang, t } = useLanguage();
  const { can } = useAuth();

  if (!can('owner', 'manager')) return null;

  const [period, setPeriod] = useState<PeriodType>('month');
  const [activeTab, setActiveTab] = useState<TabType>('sales');

  const dateRange = useMemo(() => {
    const end = new Date();
    const start = new Date();
    switch (period) {
      case 'week': start.setDate(start.getDate() - 7); break;
      case 'month': start.setDate(start.getDate() - 30); break;
      case '3months': start.setDate(start.getDate() - 90); break;
      case '6months': start.setDate(start.getDate() - 180); break;
    }
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  }, [period]);

  const { loading, data } = useQuery(GET_SALES_ANALYSIS, {
    variables: { startDate: dateRange.startDate, endDate: dateRange.endDate }
  });

  return (
    <AnalysisPresenter
      t={t}
      lang={lang}
      loading={loading}
      salesAnalysis={data?.salesAnalysis}
      deadStock={data?.deadStockAnalysis || []}
      profitability={data?.profitabilityAnalysis || []}
      inventoryHealth={data?.inventoryHealth}
      businessInsights={data?.businessInsights}
      period={period}
      onPeriodChange={setPeriod}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );
}
