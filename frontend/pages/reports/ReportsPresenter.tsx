import React, { useState } from 'react';
import { Calculator, ChevronLeft, ChevronRight, FileText, RefreshCw } from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import type { StockRow, WeekDay, CellField } from './ReportsContainer';

const WEEKDAY_KEY = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const DAY_LABEL_KEYS: { field: CellField }[] = [
  { field: 'in' },
  { field: 'jumla' },
  { field: 'uza' },
  { field: 'baki' },
];

interface ReportsPresenterProps {
  t: Record<string, string>;
  loading: boolean;
  rows: StockRow[];
  days: WeekDay[];
  weekLabel: string;
  onCellChange: (productId: string, dayIndex: number, field: CellField, raw: number) => void;
  totals: { perDay: number[]; grand: number };
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
}

function NumberCell({
  value,
  onChange,
  readOnly,
}: {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      min={0}
      value={Number.isFinite(value) ? value : 0}
      readOnly={readOnly}
      onChange={(e) => onChange && onChange(e.target.value === '' ? NaN : e.target.valueAsNumber)}
      className={cn(
        'w-[46px] min-w-[46px] max-w-[46px] bg-transparent px-0 py-1.5 text-right text-xs sm:text-sm font-semibold tabular-nums focus:outline-none focus:bg-brand-primary/5 transition-colors rounded',
        readOnly
          ? 'text-brand-primary dark:text-orange-300 font-bold cursor-default'
          : 'text-slate-900 dark:text-slate-100',
      )}
    />
  );
}

const STICKY = 'sticky left-0 z-20';

export function ReportsPresenter({
  t,
  loading,
  rows,
  days,
  weekLabel,
  onCellChange,
  totals,
  onPrevWeek,
  onNextWeek,
  onToday,
}: ReportsPresenterProps) {
  const [modalOpen, setModalOpen] = useState(false);

  if (loading) {
    return <div className="flex-1 flex items-center justify-center p-8"><LoadingSpinner /></div>;
  }

  const fieldLabel = (f: CellField) => (f === 'in' ? t.ingizo : f === 'jumla' ? t.jumla : f === 'uza' ? t.uza : t.baki);

  const renderDayCells = (row: StockRow, dayIndex: number) => {
    const d = row.days[dayIndex];
    const calc = num(row.sellingPrice) * num(d.uza);
    const field = (f: CellField) => d[f];
    return DAY_LABEL_KEYS.map((c) => (
      <td key={c.field} className="border border-slate-200 dark:border-slate-700/80 p-0">
        <NumberCell
          value={field(c.field)}
          onChange={(v) => onCellChange(row.productId, dayIndex, c.field, v)}
        />
      </td>
    )).concat(
      <td key="calc" className="border border-slate-200 dark:border-slate-700/80 bg-orange-50/40 dark:bg-orange-950/20 p-0">
        <NumberCell value={num(calc)} readOnly />
      </td>,
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative transition-colors duration-300">
      <div className="pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8 pb-4 shrink-0">
        <div className="max-w-full mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-gradient-brand rounded-xl shadow-lg shadow-orange-200 dark:shadow-none">
                <Calculator size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">{t.stockSheet}</h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">{t.stockSheetSubtitle}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={onPrevWeek}
                title={t.prevWeek}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-900 dark:text-slate-100 whitespace-nowrap">
                {weekLabel}
              </span>
              <button
                onClick={onNextWeek}
                title={t.nextWeek}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
              <button
                onClick={onToday}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs sm:text-sm font-bold transition-colors"
              >
                <RefreshCw size={15} />
                {t.today}
              </button>
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-brand text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all"
              >
                <FileText size={15} />
                {t.showCalculation}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-auto custom-scrollbar px-4 sm:px-6 lg:px-8 pb-8">
        <div className="mx-auto w-full max-w-[1280px]">
          <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] sm:rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <table className="w-max text-left border-collapse">
              <thead>
                <tr>
                  <th
                    colSpan={1}
                    rowSpan={2}
                    className={cn(STICKY, 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 sm:px-4 py-2 text-[11px] font-black text-slate-500 uppercase tracking-widest')}
                  >
                    {t.product}
                  </th>
                  {days.map((day, i) => (
                    <th
                      key={day.iso}
                      colSpan={5}
                      className={cn(
                        'border border-slate-200 dark:border-slate-700 px-1 py-2 text-center',
                        i % 2 === 0 ? 'bg-slate-50 dark:bg-slate-800/80' : 'bg-white dark:bg-slate-900',
                      )}
                    >
                      <span className="block text-[13px] sm:text-sm font-black text-slate-900 dark:text-slate-100">
                        {t[WEEKDAY_KEY[i]]}
                      </span>
                      <span className="block text-[10px] sm:text-[11px] font-semibold text-slate-400">
                        {day.date.getDate()} {day.date.toLocaleDateString(undefined, { month: 'short' })}
                      </span>
                    </th>
                  ))}
                </tr>
                <tr>
                  {days.map((day) =>
                    (['in', 'jumla', 'uza', 'baki', 'calc'] as const).map((f) => (
                      <th
                        key={`${day.iso}-${f}`}
                        className={cn(
                          'border border-slate-200 dark:border-slate-700 px-1 py-1.5 text-[9px] sm:text-[10px] font-black tracking-wider',
                          f === 'calc' ? 'text-orange-500 text-center' : 'text-slate-400 text-right',
                        )}
                      >
                        {f === 'calc' ? t.calc : fieldLabel(f)}
                      </th>
                    )),
                  )}
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={36} className="py-14 text-center text-slate-400 font-bold text-sm border border-slate-100 dark:border-slate-800">
                      {t.noProducts}
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.productId} className="hover:bg-brand-primary/[0.03]">
                      <td
                        className={cn(
                          STICKY,
                          'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 sm:px-4 py-2 whitespace-nowrap uppercase text-[11px] sm:text-xs font-black text-slate-700 dark:text-slate-300',
                        )}
                      >
                        {row.productName}
                      </td>
                      {days.map((_, i) => renderDayCells(row, i))}
                    </tr>
                  ))
                )}
              </tbody>

              {rows.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-50 dark:bg-slate-800/60">
                    <td
                      className={cn(
                        STICKY,
                        'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 sm:px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-wider',
                      )}
                    >
                      {t.calc}
                    </td>
                    {days.map((day, i) => (
                      <td
                        key={day.iso}
                        colSpan={5}
                        className="border border-slate-200 dark:border-slate-700 px-1 py-2 text-right text-[11px] sm:text-xs font-black text-brand-primary tabular-nums whitespace-nowrap"
                      >
                        {t[WEEKDAY_KEY[i]]}: {formatCurrency(totals.perDay[i])}
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-slate-100 dark:bg-slate-800">
                    <td
                      className={cn(
                        STICKY,
                        'bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 sm:px-4 py-2 text-[11px] sm:text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider',
                      )}
                    >
                      {t.grandTotal}
                    </td>
                    <td
                      colSpan={35}
                      className="border border-slate-200 dark:border-slate-700 px-4 py-2 text-right text-sm sm:text-base font-black text-slate-900 dark:text-white tabular-nums"
                    >
                      {formatCurrency(totals.grand)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} size="xl">
        <Modal.Header>
          <Modal.TitleGroup>
            <Modal.Subtitle>{weekLabel}</Modal.Subtitle>
            <Modal.Title>{t.showCalculation}</Modal.Title>
          </Modal.TitleGroup>
          <Modal.CloseButton onClick={() => setModalOpen(false)} />
        </Modal.Header>
        <Modal.Body>
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60">
                  <th className="border border-slate-200 dark:border-slate-700 px-2 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.product}</th>
                  <th className="border border-slate-200 dark:border-slate-700 px-2 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.unitPrice}</th>
                  {days.map((day, i) => (
                    <th key={day.iso} className="border border-slate-200 dark:border-slate-700 px-2 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                      {t[WEEKDAY_KEY[i]]}
                    </th>
                  ))}
                  <th className="border border-slate-200 dark:border-slate-700 px-2 py-2 text-[10px] font-black text-orange-500 uppercase tracking-widest text-right">{t.subtotal}</th>
                  <th className="border border-slate-200 dark:border-slate-700 px-2 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.cumulative}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const subtotalRow = row.days.reduce((s, d) => s + num(row.sellingPrice) * num(d.uza), 0);
                  const cumulative = rows
                    .slice(0, rows.indexOf(row) + 1)
                    .reduce((s, r) => s + r.days.reduce((ss, d) => ss + num(r.sellingPrice) * num(d.uza), 0), 0);
                  return (
                    <tr key={row.productId}>
                      <td className="border border-slate-200 dark:border-slate-700 px-2 py-2 font-bold text-slate-900 dark:text-slate-100 text-sm whitespace-nowrap">{row.productName}</td>
                      <td className="border border-slate-200 dark:border-slate-700 px-2 py-2 text-right text-sm font-semibold text-slate-500 tabular-nums">{formatCurrency(row.sellingPrice)}</td>
                      {row.days.map((d, i) => (
                        <td key={i} className="border border-slate-200 dark:border-slate-700 px-2 py-2 text-right text-sm font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                          {num(d.uza).toLocaleString()}
                        </td>
                      ))}
                      <td className="border border-slate-200 dark:border-slate-700 px-2 py-2 text-right text-sm font-bold text-brand-primary tabular-nums">{formatCurrency(num(subtotalRow))}</td>
                      <td className="border border-slate-200 dark:border-slate-700 px-2 py-2 text-right text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">{formatCurrency(num(cumulative))}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 dark:bg-slate-800/60">
                  <td className="border border-slate-200 dark:border-slate-700 px-2 py-2 text-sm font-black text-slate-900 dark:text-slate-100" colSpan={2}>{t.grandTotal}</td>
                  <td className="border border-slate-200 dark:border-slate-700 px-2 py-2 text-right text-sm font-black text-brand-primary tabular-nums" colSpan={9}>{formatCurrency(totals.grand)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            onClick={() => setModalOpen(false)}
            className="w-full py-3 rounded-xl bg-gradient-brand text-white font-bold shadow-md text-sm hover:shadow-lg transition-all"
          >
            {t.calc}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

function num(v: number | undefined | null): number {
  return Number.isFinite(v) ? Number(v) : 0;
}
