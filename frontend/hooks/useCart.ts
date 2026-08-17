import { useState, useCallback, useMemo } from 'react';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
}

interface UseCartReturn {
  items: CartItem[];
  addItem: (product: { id: string; name: string; category: string; selling_price: number }, qty?: number) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  discount: number;
  serviceCharge: number;
  tax: number;
  total: number;
  setDiscount: (v: number) => void;
  setServiceCharge: (v: number) => void;
  setTaxRate: (v: number) => void;
  taxRate: number;
}

let cartIdCounter = 0;

export function useCart(): UseCartReturn {
  const [items, setItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [serviceCharge, setServiceCharge] = useState(0);
  const [taxRate, setTaxRate] = useState(0);

  const addItem = useCallback(
    (product: { id: string; name: string; category: string; selling_price: number }, qty = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === product.id);
        if (existing) {
          return prev.map((i) =>
            i.productId === product.id ? { ...i, quantity: i.quantity + qty } : i,
          );
        }
        return [
          ...prev,
          {
            id: `cart-${++cartIdCounter}`,
            productId: product.id,
            name: product.name,
            category: product.category,
            price: product.selling_price,
            quantity: qty,
          },
        ];
      });
    },
    [],
  );

  const removeItem = useCallback((cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== cartItemId));
  }, []);

  const updateQuantity = useCallback((cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== cartItemId));
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === cartItemId ? { ...i, quantity } : i)));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setDiscount(0);
    setServiceCharge(0);
    setTaxRate(0);
  }, []);

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);

  const tax = useMemo(() => {
    const taxableAmount = subtotal - discount + serviceCharge;
    return Math.max(0, taxableAmount * (taxRate / 100));
  }, [subtotal, discount, serviceCharge, taxRate]);

  const total = useMemo(() => subtotal - discount + serviceCharge + tax, [subtotal, discount, serviceCharge, tax]);

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    itemCount,
    subtotal,
    discount,
    serviceCharge,
    tax,
    total,
    setDiscount,
    setServiceCharge,
    setTaxRate,
    taxRate,
  };
}
