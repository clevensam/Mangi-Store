import { describe, it, expect } from 'vitest';
import {
  addLine,
  removeLine,
  updateLineQuantity,
  itemCount,
  subtotalOf,
  taxOf,
  totalOf,
  lineTotal,
} from './cart';

const product = { id: 'p1', name: 'Beer', category: 'beer', selling_price: 5000 };

describe('cart pure helpers', () => {
  it('adds a new line', () => {
    const lines = addLine([], product, 2, () => 'c1');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ id: 'c1', productId: 'p1', quantity: 2, price: 5000 });
  });

  it('increments quantity when the product is already in the cart', () => {
    let lines = addLine([], product, 1, () => 'c1');
    lines = addLine(lines, product, 3, () => 'c2');
    expect(lines).toHaveLength(1);
    expect(lines[0].quantity).toBe(4);
  });

  it('removes a line by cart item id', () => {
    let lines = addLine([], product, 1, () => 'c1');
    lines = addLine(lines, { ...product, id: 'p2', selling_price: 3000 }, 1, () => 'c2');
    expect(lines).toHaveLength(2);
    lines = removeLine(lines, 'c1');
    expect(lines).toHaveLength(1);
    expect(lines[0].productId).toBe('p2');
  });

  it('drops the line when quantity is set to 0 or below', () => {
    let lines = addLine([], product, 1, () => 'c1');
    lines = updateLineQuantity(lines, 'c1', 0);
    expect(lines).toHaveLength(0);
  });

  it('updates quantity while preserving the line', () => {
    const lines = updateLineQuantity(addLine([], product, 1, () => 'c1'), 'c1', 5);
    expect(lines[0].quantity).toBe(5);
  });

  it('computes item count, subtotal, ta and totals', () => {
    const lines = addLine([], product, 2, () => 'c1');
    const lines2 = addLine(lines, { ...product, id: 'p2', selling_price: 1000 }, 3, () => 'c2');

    expect(itemCount(lines2)).toBe(5);
    expect(subtotalOf(lines2)).toBe(2 * 5000 + 3 * 1000); // 13000
    expect(lineTotal(lines2[0])).toBe(10000);

    const input = { subtotal: 13000, discount: 1000, serviceCharge: 500, taxRate: 18 };
    const tax = taxOf(input);
    expect(tax).toBe(Math.max(0, (13000 - 1000 + 500) * 0.18));
    expect(totalOf(input)).toBeCloseTo(13000 - 1000 + 500 + tax);
  });

  it('never produces negative tax', () => {
    expect(taxOf({ subtotal: 100, discount: 500, serviceCharge: 0, taxRate: 18 })).toBe(0);
  });
});
