import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../contexts/AuthContext';
import { useProducts } from '../../hooks/useProducts';
import { ReportsPresenter } from './ReportsPresenter';

export interface DaySlot {
  in: number;
  jumla: number;
  uza: number;
  baki: number;
}

export interface StockRow {
  productId: string;
  productName: string;
  sellingPrice: number;
  days: DaySlot[]; // length 7, Mon=0 .. Sun=6
}

export interface WeekDay {
  date: Date;
  iso: string;
  weekday: number; // 1..7, 1=Mon
}

export type CellField = 'in' | 'jumla' | 'uza' | 'baki';

const num = (v: number): number => (Number.isFinite(v) ? v : 0);

function dateISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

// Return the Monday that starts the week containing `date` (ISO weekday: Mon=1..Sun=7)
function mondayOf(date: Date): Date {
  const d = startOfDay(date);
  const jsDay = d.getDay(); // 0=Sun..6=Sat
  const diff = (jsDay === 0 ? 6 : jsDay - 1); // days since Monday
  d.setDate(d.getDate() - diff);
  return d;
}

function buildWeekDays(weekStart: Date): WeekDay[] {
  const days: WeekDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    days.push({ date: d, iso: dateISO(d), weekday: i + 1 });
  }
  return days;
}

export function buildEmptyDays(): DaySlot[] {
  return Array.from({ length: 7 }, () => ({ in: 0, jumla: 0, uza: 0, baki: 0 }));
}

function emptyStockRow(p: { id: string; name: string; selling_price?: number | null }): StockRow {
  return {
    productId: p.id,
    productName: p.name,
    sellingPrice: num(Number(p.selling_price) || 0),
    days: buildEmptyDays(),
  };
}

function applyEdit(days: DaySlot[], i: number, field: CellField, raw: number): DaySlot[] {
  const v = num(raw);
  const next = days.map((d) => ({ ...d }));
  const d = next[i];

  if (field === 'in') {
    d.in = v;
    d.jumla = v + (i > 0 ? num(next[i - 1].baki) : 0);
    d.baki = num(d.jumla) - num(d.uza);
  } else if (field === 'uza') {
    d.uza = v;
    d.baki = num(d.jumla) - num(d.uza);
  } else if (field === 'baki') {
    d.baki = v;
    d.uza = num(d.jumla) - num(d.baki);
  } else if (field === 'jumla') {
    d.jumla = v;
    d.baki = num(d.jumla) - num(d.uza);
  }

  // cascade forward: jumla[i+1] = in[i+1] + baki[i]
  for (let j = i + 1; j < 7; j++) {
    next[j].jumla = num(next[j].in) + num(next[j - 1].baki);
    next[j].baki = num(next[j].jumla) - num(next[j].uza);
  }

  return next;
}

export function ReportsContainer() {
  const { t } = useLanguage();
  const { can } = useAuth();
  const { products, loading } = useProducts();

  const [weekStart, setWeekStart] = useState<Date>(() => mondayOf(new Date()));
  // in-memory per-week sheets, keyed by Monday ISO
  const [sheets, setSheets] = useState<Record<string, Record<string, StockRow>>>({});

  const weekKey = dateISO(weekStart);
  const days = useMemo(() => buildWeekDays(weekStart), [weekStart]);

  // seed current week sheet when products load / week changes
  useEffect(() => {
    if (!products.length) return;
    setSheets((prev) => {
      if (prev[weekKey]) return prev;
      const map: Record<string, StockRow> = {};
      products.forEach((p) => {
        map[p.id] = emptyStockRow(p);
      });
      return { ...prev, [weekKey]: map };
    });
  }, [products, weekKey]);

  const rows: StockRow[] = useMemo(() => {
    const map = sheets[weekKey];
    if (!map) return [];
    return products.map((p) => map[p.id] ?? emptyStockRow(p));
  }, [sheets, weekKey, products]);

  const onCellChange = useCallback(
    (productId: string, dayIndex: number, field: CellField, raw: number) => {
      const key = weekKey;
      setSheets((prev) => {
        const map = { ...(prev[key] || {}) };
        const row = map[productId] ? { ...map[productId], days: map[productId].days.map((d) => ({ ...d })) } : emptyStockRow({ id: productId, name: '', selling_price: 0 });
        row.days = applyEdit(row.days, dayIndex, field, raw);
        map[productId] = row;
        return { ...prev, [key]: map };
      });
    },
    [weekKey],
  );

  const totals = useMemo(() => {
    const perDay = [0, 0, 0, 0, 0, 0, 0];
    let grand = 0;
    rows.forEach((r) => {
      r.days.forEach((d, i) => {
        const calc = num(r.sellingPrice) * num(d.uza);
        perDay[i] += calc;
        grand += calc;
      });
    });
    return { perDay, grand };
  }, [rows]);

  const goPrevWeek = useCallback(() => {
    setWeekStart((s) => {
      const x = new Date(s);
      x.setDate(x.getDate() - 7);
      return x;
    });
  }, []);

  const goNextWeek = useCallback(() => {
    setWeekStart((s) => {
      const x = new Date(s);
      x.setDate(x.getDate() + 7);
      return x;
    });
  }, []);

  const goToday = useCallback(() => setWeekStart(mondayOf(new Date())), []);

  if (!can('owner', 'manager')) return null;

  return (
    <ReportsPresenter
      t={t}
      loading={loading}
      rows={rows}
      days={days}
      weekLabel={weekLabel(days)}
      onCellChange={onCellChange}
      totals={totals}
      onPrevWeek={goPrevWeek}
      onNextWeek={goNextWeek}
      onToday={goToday}
    />
  );
}

function weekLabel(days: WeekDay[]): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  return `${fmt(days[0].date)} – ${fmt(days[6].date)}`;
}
