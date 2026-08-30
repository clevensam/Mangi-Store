export interface CartLine {
  id: string;
  productId: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
}

export interface CartTotalsInput {
  subtotal: number;
  discount: number;
  serviceCharge: number;
  taxRate: number;
}

export function lineTotal(line: Pick<CartLine, 'price' | 'quantity'>): number {
  return line.price * line.quantity;
}

export function itemCount(lines: Pick<CartLine, 'quantity'>[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}

export function subtotalOf(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + lineTotal(l), 0);
}

// Tax is applied to (subtotal - discount + serviceCharge), never negative.
export function taxOf({ subtotal, discount, serviceCharge, taxRate }: CartTotalsInput): number {
  const taxable = subtotal - discount + serviceCharge;
  return Math.max(0, taxable * (taxRate / 100));
}

export function totalOf(input: CartTotalsInput, tax: number = taxOf(input)): number {
  return input.subtotal - input.discount + input.serviceCharge + tax;
}

export function addLine(
  lines: CartLine[],
  product: { id: string; name: string; category: string; selling_price: number },
  qty = 1,
  nextId: () => string,
): CartLine[] {
  const existing = lines.find((l) => l.productId === product.id);
  if (existing) {
    return lines.map((l) => (l.productId === product.id ? { ...l, quantity: l.quantity + qty } : l));
  }
  return [
    ...lines,
    {
      id: nextId(),
      productId: product.id,
      name: product.name,
      category: product.category,
      price: product.selling_price,
      quantity: qty,
    },
  ];
}

export function updateLineQuantity(lines: CartLine[], cartItemId: string, quantity: number): CartLine[] {
  if (quantity <= 0) {
    return lines.filter((l) => l.id !== cartItemId);
  }
  return lines.map((l) => (l.id === cartItemId ? { ...l, quantity } : l));
}

export function removeLine(lines: CartLine[], cartItemId: string): CartLine[] {
  return lines.filter((l) => l.id !== cartItemId);
}
