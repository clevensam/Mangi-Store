import React, { useState, useMemo } from 'react';
import { useQuery, gql } from '@apollo/client';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../contexts/AuthContext';
import { ReportsPresenter } from './ReportsPresenter';

const SALES_REPORT = gql`
  query SalesReport($startDate: String!, $endDate: String!) {
    salesReport(startDate: $startDate, endDate: $endDate) {
      items {
        productId
        productName
        totalQuantity
        totalRevenue
        totalCost
        totalProfit
      }
      summary {
        totalRevenue
        totalQuantity
        totalProfit
      }
    }
  }
`;

type PeriodType = 'today' | 'custom' | 'week' | 'month' | '3months' | '6months';

export function ReportsContainer() {
  const { lang, t } = useLanguage();
  const { can } = useAuth();
  const [period, setPeriod] = useState<PeriodType>('3months');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');

  const dateRange = useMemo(() => {
    let start: Date;
    let end: Date = new Date();
    switch (period) {
      case 'today':
        start = new Date(); start.setHours(0, 0, 0, 0);
        end = new Date(); end.setHours(23, 59, 59, 999);
        break;
      case 'week': start = new Date(); start.setDate(start.getDate() - 7); break;
      case 'month': start = new Date(); start.setDate(start.getDate() - 30); break;
      case '3months': start = new Date(); start.setDate(start.getDate() - 90); break;
      case '6months': start = new Date(); start.setDate(start.getDate() - 180); break;
      case 'custom':
        start = new Date(selectedDate); start.setHours(0, 0, 0, 0);
        end = new Date(selectedDate); end.setHours(23, 59, 59, 999);
        break;
      default: start = new Date(); start.setDate(start.getDate() - 90);
    }
    return { start, end };
  }, [period, selectedDate]);

  const { loading, data } = useQuery(SALES_REPORT, {
    variables: { startDate: dateRange.start.toISOString(), endDate: dateRange.end.toISOString() },
  });

  const reportItems = data?.salesReport?.items ?? [];
  const reportSummary = data?.salesReport?.summary;

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return reportItems;
    const query = searchTerm.toLowerCase();
    return reportItems.filter((item: any) => item.productName.toLowerCase().includes(query));
  }, [reportItems, searchTerm]);

  const totals = useMemo(() => {
    if (!searchTerm.trim() && reportSummary) {
      return { totalRevenue: reportSummary.totalRevenue, totalQuantity: reportSummary.totalQuantity, totalProfit: reportSummary.totalProfit };
    }
    return filteredProducts.reduce(
      (acc: any, item: any) => ({
        totalRevenue: acc.totalRevenue + item.totalRevenue,
        totalQuantity: acc.totalQuantity + item.totalQuantity,
        totalProfit: acc.totalProfit + item.totalProfit,
      }),
      { totalRevenue: 0, totalQuantity: 0, totalProfit: 0 },
    );
  }, [filteredProducts, reportSummary, searchTerm]);

  if (!can('owner', 'manager')) return null;

  return (
    <ReportsPresenter
      t={t}
      lang={lang}
      loading={loading}
      filteredProducts={filteredProducts}
      totals={totals}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      period={period}
      onPeriodChange={setPeriod}
      selectedDate={selectedDate}
      onDateChange={setSelectedDate}
    />
  );
}
