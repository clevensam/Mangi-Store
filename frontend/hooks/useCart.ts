import { useState, useCallback, useMemo } from 'react';
import {
  addLine,
  removeLine,
  updateLineQuantity,
  itemCount,
  subtotalOf,
  taxOf,
  totalOf,
} from '../lib/cart';
import type { CartLine } from '../lib/cart';

export type { CartLine };

interface UseCartReturn {
  items: CartLine[];
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
  const [items, setItems] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState(0);
  const [serviceCharge, setServiceCharge] = useState(0);
  const [taxRate, setTaxRate] = useState(0);

  const addItem = useCallback(
    (product: { id: string; name: string; category: string; selling_price: number }, qty = 1) => {
      setItems((prev) =>
        addLine(prev, product, qty, () => `cart-${++cartIdCounter}`),
      );
    },
    [],
  );

  const removeItem = useCallback((cartItemId: string) => {
    setItems((prev) => removeLine(prev, cartItemId));
  }, []);

  const updateQuantity = useCallback((cartItemId: string, quantity: number) => {
    setItems((prev) => updateLineQuantity(prev, cartItemId, quantity));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setDiscount(0);
    setServiceCharge(0);
    setTaxRate(0);
  }, []);

  const itemCount = useMemo(() => itemCount(items), [items]);

  const subtotal = useMemo(() => subtotalOf(items), [items]);

  const tax = useMemo(() => taxOf({ subtotal, discount, serviceCharge, taxRate }), [subtotal, discount, serviceCharge, taxRate]);

  const total = useMemo(() => totalOf({ subtotal, discount, serviceCharge, taxRate }), [subtotal, discount, serviceCharge, taxRate]);

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
