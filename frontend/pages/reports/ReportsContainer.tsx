import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../contexts/AuthContext';
import { useProducts } from '../../hooks/useProducts';
import { ReportsPresenter } from './ReportsPresenter';

export type DateKey = 'date1' | 'date2';

export interface StockRow {
  productId: string;
  productName: string;
  sellingPrice: number;
  in1: number;
  jumla1: number;
  uza1: number;
  baki1: number;
  in2: number;
  jumla2: number;
  uza2: number;
  baki2: number;
}

type CellField = 'in' | 'jumla' | 'uza' | 'baki';

const num = (v: number): number => (Number.isFinite(v) ? v : 0);
const clampNonNegative = (v: number): number => (Number.isFinite(v) && v >= 0 ? v : 0);

function dateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function ReportsContainer() {
  const { t } = useLanguage();
  const { can } = useAuth();
  const { products, loading } = useProducts();

  const [date1, setDate1] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return dateString(d);
  });
  const [date2, setDate2] = useState(() => dateString(new Date()));

  const [rows, setRows] = useState<StockRow[]>([]);

  useEffect(() => {
    if (!products.length) {
      setRows([]);
      return;
    }
    setRows(
      products.map((p) => ({
        productId: p.id,
        productName: p.name,
        sellingPrice: clampNonNegative(Number(p.selling_price) || 0),
        in1: 0,
        jumla1: 0,
        uza1: 0,
        baki1: 0,
        in2: 0,
        jumla2: 0,
        uza2: 0,
        baki2: 0,
      })),
    );
  }, [products]);

  const applyDayRelation = useCallback(
    (prev: StockRow, dateKey: DateKey, field: CellField, raw: number): StockRow => {
      const v = num(raw);
      const day = dateKey === 'date1' ? '1' : '2';
      const inKey = `in${day}` as const;
      const jumlaKey = `jumla${day}` as const;
      const uzaKey = `uza${day}` as const;
      const bakiKey = `baki${day}` as const;

      const next = { ...prev };

      if (field === 'in') {
        next[inKey] = v;
        if (dateKey === 'date1') {
          next.jumla1 = num(next.in1);
          next.baki1 = num(next.jumla1) - num(next.uza1);
        } else {
          next.jumla2 = num(next.in2) + num(next.baki1);
          next.baki2 = num(next.jumla2) - num(next.uza2);
        }
        return next;
      }

      if (field === 'jumla') {
        next[jumlaKey] = v;
        next[bakiKey] = num(next[jumlaKey]) - num(next[uzaKey]);
        return next;
      }

      if (field === 'uza') {
        next[uzaKey] = v;
        next[bakiKey] = num(next[jumlaKey]) - num(next[uzaKey]);
        return next;
      }

      if (field === 'baki') {
        next[bakiKey] = v;
        next[uzaKey] = num(next[jumlaKey]) - num(next[bakiKey]);
        if (dateKey === 'date2') {
          next.jumla2 = num(next.in2) + num(next.baki1);
        }
        return next;
      }

      return next;
    },
    [],
  );

  const onCellChange = useCallback(
    (productId: string, dateKey: DateKey, field: CellField, raw: number) => {
      setRows((prev) => prev.map((r) => (r.productId === productId ? applyDayRelation(r, dateKey, field, raw) : r)));
    },
    [applyDayRelation],
  );

  const calcFor = (row: StockRow, dateKey: DateKey): number => {
    const qty = dateKey === 'date1' ? row.uza1 : row.uza2;
    return num(row.sellingPrice) * num(qty);
  };

  const totals = useMemo(() => {
    const calc1 = rows.reduce((sum, r) => sum + calcFor(r, 'date1'), 0);
    const calc2 = rows.reduce((sum, r) => sum + calcFor(r, 'date2'), 0);
    return { calc1, calc2, grand: calc1 + calc2 };
  }, [rows]);

  if (!can('owner', 'manager')) return null;

  return (
    <ReportsPresenter
      t={t}
      loading={loading}
      rows={rows}
      date1={date1}
      date2={date2}
      onDate1Change={setDate1}
      onDate2Change={setDate2}
      onCellChange={onCellChange}
      totals={totals}
    />
  );
}
