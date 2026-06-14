export function calcProfitMargin(revenue: number, cost: number): number {
  if (revenue <= 0) return 0;
  return ((revenue - cost) / revenue) * 100;
}

export function calcTotalRevenue(sales: Array<{ total_price: number }>): number {
  return sales.reduce((sum, s) => sum + Number(s.total_price), 0);
}

export function calcTotalCost(
  sales: Array<{ product_id: string; quantity: number }>,
  productMap: Map<string, { buying_price?: number | null }>,
): number {
  let total = 0;
  for (const sale of sales) {
    const product = productMap.get(sale.product_id);
    if (product?.buying_price != null) {
      total += product.buying_price * sale.quantity;
    }
  }
  return total;
}

export function calcGrossProfit(revenue: number, cost: number): number {
  return revenue - cost;
}

export function calcInventoryValue(
  products: Array<{ buying_price?: number | null; quantity: number }>,
): number {
  return products.reduce((sum, p) => sum + (p.buying_price ?? 0) * p.quantity, 0);
}

export function calcPotentialProfit(
  products: Array<{ buying_price?: number | null; selling_price?: number | null; quantity: number }>,
): number {
  return products.reduce(
    (sum, p) => sum + ((p.selling_price ?? 0) - (p.buying_price ?? 0)) * p.quantity,
    0,
  );
}

export function calcAverageTransactionValue(totalRevenue: number, transactionCount: number): number {
  return transactionCount > 0 ? totalRevenue / transactionCount : 0;
}

export function calcDaysSinceLastSale(lastSaleDate: Date | string | null | undefined): number {
  if (!lastSaleDate) return 999;
  const now = new Date();
  const last = new Date(lastSaleDate);
  return Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
}
