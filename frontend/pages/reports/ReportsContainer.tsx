import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import { toast } from 'sonner';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../contexts/AuthContext';
import { useProducts } from '../../hooks/useProducts';
import { ReportsPresenter } from './ReportsPresenter';

const STOCK_SHEET = gql`
  query StockSheet($weekDate: String!) {
    stockSheet(weekDate: $weekDate) {
      productId
      weekday
      in
      jumla
      uza
      baki
    }
  }
`;

const SAVE_STOCK_SHEET = gql`
  mutation SaveStockSheet($weekDate: String!, $entries: [StockEntryInput!]!) {
    saveStockSheet(weekDate: $weekDate, entries: $entries)
  }
`;

export interface DaySlot {
  in: number;
  jumla: number;
  uza: number;
  baki: number;
}

export interface StockRow {
  productId: string;
  productName: string;
  category: string;
  buyingPrice: number;
  sellingPrice: number;
  days: DaySlot[]; // length 7, Mon=0 .. Sun=6
}

export interface WeekDay {
  date: Date;
  iso: string;
  weekday: number; // 1..7, 1=Mon
}

export type CellField = 'in' | 'jumla' | 'uza' | 'baki';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const SAVE_DEBOUNCE_MS = 900;

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

function emptyStockRow(p: { id: string; name: string; selling_price?: number | null; buying_price?: number | null; category?: string | null }): StockRow {
  return {
    productId: p.id,
    productName: p.name,
    category: p.category || '',
    buyingPrice: num(Number(p.buying_price) || 0),
    sellingPrice: num(Number(p.selling_price) || 0),
    days: buildEmptyDays(),
  };
}

function applyEdit(days: DaySlot[], i: number, field: CellField, raw: number): DaySlot[] {
  const v = Math.max(0, num(raw));
  const next = days.map((d) => ({ ...d }));
  const d = next[i];

  if (field === 'in') {
    d.in = v;
    d.jumla = v + (i > 0 ? num(next[i - 1].baki) : 0);
    d.baki = Math.max(0, num(d.jumla) - num(d.uza));
  } else if (field === 'uza') {
    d.uza = v;
    d.baki = Math.max(0, num(d.jumla) - num(d.uza));
  } else if (field === 'baki') {
    d.baki = v;
    d.uza = Math.max(0, num(d.jumla) - num(d.baki));
  } else if (field === 'jumla') {
    d.jumla = v;
    d.baki = Math.max(0, num(d.jumla) - num(d.uza));
  }

  // cascade forward: jumla[i+1] = in[i+1] + baki[i]
  for (let j = i + 1; j < 7; j++) {
    next[j].jumla = Math.max(0, num(next[j].in) + num(next[j - 1].baki));
    next[j].baki = Math.max(0, num(next[j].jumla) - num(next[j].uza));
  }

  return next;
}

export function ReportsContainer() {
  const { t } = useLanguage();
  const { can } = useAuth();
  const { products, loading } = useProducts();

  const [weekStart, setWeekStart] = useState<Date>(() => mondayOf(new Date()));
  // DB-backed in-memory sheets, keyed by Monday ISO
  const [sheets, setSheets] = useState<Record<string, Record<string, StockRow>>>({});
  // weeks that have been loaded from the DB (so we never overwrite edits with a repeat fetch)
  const [loadedWeeks, setLoadedWeeks] = useState<Record<string, boolean>>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const weekKey = dateISO(weekStart);
  const days = useMemo(() => buildWeekDays(weekStart), [weekStart]);

  // Auto-navigate to the new current week when the week rolls over (Monday 00:00),
  // but only if the user is parked on the week that just ended (now a past week).
  useEffect(() => {
    const check = () => {
      const newMonday = mondayOf(new Date());
      setWeekStart((s) => {
        const prevMonday = new Date(newMonday);
        prevMonday.setDate(newMonday.getDate() - 7);
        return dateISO(s) === dateISO(prevMonday) ? newMonday : s;
      });
    };
    check();
    const id = setInterval(check, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const sheetsRef = useRef(sheets);
  sheetsRef.current = sheets;

  const { data: sheetData, loading: sheetLoading } = useQuery(STOCK_SHEET, {
    variables: { weekDate: weekKey },
  });

  const [saveStockSheet] = useMutation(SAVE_STOCK_SHEET);

  // Merge DB entries for the current week once they load (skip if already loaded / user editing)
  useEffect(() => {
    if (sheetLoading) return;
    if (loadedWeeks[weekKey]) return;
    const entries = sheetData?.stockSheet ?? [];
    if (!products.length) return;

    setSheets((prev) => {
      const existing = prev[weekKey] || {};
      const merged: Record<string, StockRow> = {};

      products.forEach((p) => {
        const base = existing[p.id] || emptyStockRow(p);
        const row: StockRow = { ...base, days: base.days.map((d) => ({ ...d })) };
        merged[p.id] = row;
      });

      // If this week was never loaded from the DB, apply saved entries
      if (!loadedWeeks[weekKey]) {
        entries.forEach((e: any) => {
          if (!merged[e.productId]) return;
          const row = merged[e.productId];
          const i = Math.min(6, Math.max(0, e.weekday));
          row.days[i] = {
            in: num(e.in),
            jumla: num(e.jumla),
            uza: num(e.uza),
            baki: num(e.baki),
          };
        });
      }
      return { ...prev, [weekKey]: merged };
    });

    setLoadedWeeks((prev) => (prev[weekKey] ? prev : { ...prev, [weekKey]: true }));
  }, [sheetLoading, sheetData, weekKey, products, loadedWeeks]);

  // Ensure every product has a row for the current week (handles product create/delete)
  useEffect(() => {
    if (!products.length || !loadedWeeks[weekKey]) return;
    setSheets((prev) => {
      const map = { ...(prev[weekKey] || {}) };
      let changed = false;
      const activeIds = new Set(products.map((p) => p.id));
      Object.keys(map).forEach((pid) => {
        if (!activeIds.has(pid)) {
          delete map[pid];
          changed = true;
        }
      });
      products.forEach((p) => {
        if (!map[p.id]) {
          map[p.id] = emptyStockRow(p);
          changed = true;
        }
      });
      if (!changed) return prev;
      return { ...prev, [weekKey]: map };
    });
  }, [products, weekKey, loadedWeeks]);

  const rows: StockRow[] = useMemo(() => {
    const map = sheets[weekKey];
    if (!map) return [];
    return propsForRows(map, products);
  }, [sheets, weekKey, products]);

  const savedWeekRef = useRef<string | null>(null);

  const persist = useCallback(
    (key: string) => {
      const map = sheetsRef.current[key];
      if (!map) return;
      const entries = Object.values(map).flatMap((row) =>
        row.days.map((d, i) => ({
          productId: row.productId,
          weekday: i,
          in: num(d.in),
          jumla: num(d.jumla),
          uza: num(d.uza),
          baki: num(d.baki),
        })),
      );
      setSaveStatus('saving');
      saveStockSheet({ variables: { weekDate: key, entries } })
        .then(() => {
          savedWeekRef.current = key;
          setSaveStatus('saved');
        })
        .catch(() => {
          setSaveStatus('error');
          toast.error(t.saveError || 'Failed to save changes');
        });
    },
    [saveStockSheet, t.saveError],
  );

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushPending = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
      persist(weekKey);
    }
  }, [persist, weekKey]);

  const onCellChange = useCallback(
    (productId: string, dayIndex: number, field: CellField, raw: number) => {
      const key = weekKey;
      setSheets((prev) => {
        const map = { ...(prev[key] || {}) };
        const row = map[productId]
          ? { ...map[productId], days: map[productId].days.map((d) => ({ ...d })) }
          : emptyStockRow({ id: productId, name: '', selling_price: 0 });
        row.days = applyEdit(row.days, dayIndex, field, raw);
        map[productId] = row;
        return { ...prev, [key]: map };
      });

      // Debounced auto-save
      setSaveStatus('idle');
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => persist(key), SAVE_DEBOUNCE_MS);
    },
    [persist, weekKey],
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
    flushPending();
    setWeekStart((s) => {
      const x = new Date(s);
      x.setDate(x.getDate() - 7);
      return x;
    });
  }, [flushPending]);

  const goNextWeek = useCallback(() => {
    flushPending();
    setWeekStart((s) => {
      const next = new Date(s);
      next.setDate(next.getDate() + 7);
      // Allow navigating up to the current week only (no future weeks).
      const currentMonday = mondayOf(new Date());
      return next > currentMonday ? currentMonday : next;
    });
  }, [flushPending]);

  const goToday = useCallback(() => {
    flushPending();
    setWeekStart(mondayOf(new Date()));
  }, [flushPending]);

  // Lock any day after today (not yet reached), across all weeks.
  const todayStart = startOfDay(new Date());
  const dayLocked = useMemo(
    () => days.map((d) => startOfDay(d.date) > todayStart),
    [days, todayStart],
  );

  // Navigation is limited to the current week and past weeks only.
  const currentMonday = mondayOf(new Date());
  const canGoNext = weekStart < currentMonday;

  if (!can('owner', 'manager')) return null;

  return (
    <ReportsPresenter
      t={t}
      loading={loading || (sheetLoading && !loadedWeeks[weekKey])}
      rows={rows}
      days={days}
      weekLabel={weekLabel(days)}
      onCellChange={onCellChange}
      totals={totals}
      onPrevWeek={goPrevWeek}
      onNextWeek={goNextWeek}
      canGoNext={canGoNext}
      onToday={goToday}
      saveStatus={saveStatus}
      dayLocked={dayLocked}
    />
  );
}

function propsForRows(map: Record<string, StockRow>, products: any[]): StockRow[] {
  return products.map((p) => map[p.id] ?? emptyStockRow(p));
}

function weekLabel(days: WeekDay[]): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  return `${fmt(days[0].date)} – ${fmt(days[6].date)}`;
}
