import React, { useState } from 'react';
import { Calculator, Calendar, FileText } from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import type { StockRow, DateKey } from './ReportsContainer';

type CellField = 'in' | 'jumla' | 'uza' | 'baki';

interface ReportsPresenterProps {
  t: Record<string, string>;
  loading: boolean;
  rows: StockRow[];
  date1: string;
  date2: string;
  onDate1Change: (v: string) => void;
  onDate2Change: (v: string) => void;
  onCellChange: (productId: string, dateKey: DateKey, field: CellField, raw: number) => void;
  totals: { calc1: number; calc2: number; grand: number };
}

function DatePicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
      <Calendar size={14} className="text-slate-400" />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-transparent text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
        />
      </div>
    </div>
  );
}

function NumberCell({
  value,
  onChange,
  readOnly,
  accent,
}: {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  accent?: boolean;
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
        'w-full min-w-[64px] rounded-lg px-2 py-1.5 text-right text-sm font-semibold tabular-nums focus:outline-none focus:ring-2 transition-colors',
        readOnly
          ? accent
            ? 'bg-orange-50 dark:bg-orange-950/30 text-brand-primary dark:text-orange-300 cursor-default'
            : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-default'
          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-brand-primary/20 focus:border-brand-primary/40',
      )}
    />
  );
}

export function ReportsPresenter({
  t,
  loading,
  rows,
  date1,
  date2,
  onDate1Change,
  onDate2Change,
  onCellChange,
  totals,
}: ReportsPresenterProps) {
  const [modalOpen, setModalOpen] = useState(false);

  if (loading) {
    return <div className="flex-1 flex items-center justify-center p-8"><LoadingSpinner /></div>;
  }

  const renderDayCells = (dateKey: DateKey, row: StockRow) => {
    const d = dateKey === 'date1' ? '1' : '2';
    const val = (field: 'in' | 'jumla' | 'uza' | 'baki') => row[`${field}${d}` as keyof StockRow] as number;
    const calc = dateKey === 'date1'
      ? Number(row.sellingPrice) * Number(row.uza1)
      : Number(row.sellingPrice) * Number(row.uza2);

    return (
      <React.Fragment key={`${dateKey}-${row.productId}`}>
        <td className="py-2 sm:py-3 px-1.5 sm:px-2">
          <NumberCell value={val('in')} onChange={(v) => onCellChange(row.productId, dateKey, 'in', v)} />
        </td>
        <td className="py-2 sm:py-3 px-1.5 sm:px-2">
          <NumberCell value={val('jumla')} onChange={(v) => onCellChange(row.productId, dateKey, 'jumla', v)} />
        </td>
        <td className="py-2 sm:py-3 px-1.5 sm:px-2">
          <NumberCell value={val('uza')} onChange={(v) => onCellChange(row.productId, dateKey, 'uza', v)} />
        </td>
        <td className="py-2 sm:py-3 px-1.5 sm:px-2">
          <NumberCell value={val('baki')} onChange={(v) => onCellChange(row.productId, dateKey, 'baki', v)} />
        </td>
        <td className="py-2 sm:py-3 px-1.5 sm:px-2">
          <NumberCell value={num(calc)} readOnly accent />
        </td>
      </React.Fragment>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative transition-colors duration-300">
      <div className="pt-6 sm:pt-8 px-4 sm:px-6 lg:px-8 pb-4 shrink-0">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-gradient-brand rounded-xl shadow-lg shadow-orange-200 dark:shadow-none">
                <Calculator size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">{t.stockSheet}</h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">{t.stockSheetSubtitle}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <DatePicker label={t.dateFrom} value={date1} onChange={onDate1Change} />
              <DatePicker label={t.dateTo} value={date2} onChange={onDate2Change} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-4 px-4 sm:px-6 lg:px-8 pb-8 no-scrollbar">
        <div className="max-w-[1400px] mx-auto">
          <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
              <p className="text-[11px] sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                {t.calcDesc}
              </p>
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-brand text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all"
              >
                <FileText size={16} />
                {t.showCalculation}
              </button>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-50 dark:border-slate-800">
                    <th rowSpan={2} className="py-3 px-3 sm:px-6 text-[11px] font-black text-slate-400 uppercase tracking-widest text-left align-bottom">{t.product}</th>
                    <th colSpan={5} className="py-3 px-2 text-center text-sm font-black text-slate-900 dark:text-slate-100 border-l border-slate-100 dark:border-slate-800 bg-orange-50/50 dark:bg-orange-950/10">
                      {date1}
                    </th>
                    <th colSpan={5} className="py-3 px-2 text-center text-sm font-black text-slate-900 dark:text-slate-100 border-l border-slate-100 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-950/10">
                      {date2}
                    </th>
                  </tr>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="py-2 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right border-l border-slate-100 dark:border-slate-800">{t.ingizo}</th>
                    <th className="py-2 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.jumla}</th>
                    <th className="py-2 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.uza}</th>
                    <th className="py-2 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.baki}</th>
                    <th className="py-2 px-2 text-[10px] font-black text-orange-500 uppercase tracking-widest text-right">{t.calc}</th>
                    <th className="py-2 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right border-l border-slate-100 dark:border-slate-800">{t.ingizo}</th>
                    <th className="py-2 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.jumla}</th>
                    <th className="py-2 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.uza}</th>
                    <th className="py-2 px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.baki}</th>
                    <th className="py-2 px-2 text-[10px] font-black text-orange-500 uppercase tracking-widest text-right">{t.calc}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {rows.length === 0 ? (
                    <tr><td colSpan={11} className="py-12 sm:py-16 text-center text-slate-400 dark:text-slate-500 text-xs sm:text-sm">{t.noProducts}</td></tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.productId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-2 sm:py-3 px-3 sm:px-6">
                          <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 whitespace-nowrap">{row.productName}</span>
                        </td>
                        {renderDayCells('date1', row)}
                        {renderDayCells('date2', row)}
                      </tr>
                    ))
                  )}
                </tbody>
                {rows.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                      <td className="py-3 px-3 sm:px-6 text-[11px] font-black text-slate-500 uppercase tracking-wider" colSpan={1}>{t.calc}</td>
                      <td className="py-3 px-2 font-black text-brand-primary text-sm tabular-nums text-right" colSpan={4}>
                        {date1}: {formatCurrency(totals.calc1)}
                      </td>
                      <td className="py-3 px-2 font-black text-brand-primary text-sm tabular-nums text-right border-l border-slate-100 dark:border-slate-800" colSpan={5}>
                        {date2}: {formatCurrency(totals.calc2)}
                      </td>
                      <td className="py-3 px-2" colSpan={1} />
                    </tr>
                    <tr className="bg-slate-100 dark:bg-slate-800/70 border-t border-slate-100 dark:border-slate-800">
                      <td className="py-3 sm:py-4 px-3 sm:px-6 text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider" colSpan={5}>
                        {t.grandTotal}
                      </td>
                      <td className="py-3 sm:py-4 px-2 font-black text-slate-900 dark:text-white text-sm sm:text-base tabular-nums text-right border-l border-slate-100 dark:border-slate-800" colSpan={6}>
                        {formatCurrency(totals.grand)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} size="xl">
        <Modal.Header>
          <Modal.TitleGroup>
            <Modal.Subtitle>{t.stockSheet}</Modal.Subtitle>
            <Modal.Title>{t.showCalculation}</Modal.Title>
          </Modal.TitleGroup>
          <Modal.CloseButton onClick={() => setModalOpen(false)} />
        </Modal.Header>
        <Modal.Body>
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="py-2 px-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">{t.product}</th>
                  <th className="py-2 px-2 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">{t.unitPrice}</th>
                  <th className="py-2 px-2 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">{date1} {t.uza}</th>
                  <th className="py-2 px-2 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">{date2} {t.uza}</th>
                  <th className="py-2 px-2 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">{t.subtotal}</th>
                  <th className="py-2 px-2 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">{t.cumulative}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {rows.map((row) => {
                  const qty1 = Number(row.uza1);
                  const qty2 = Number(row.uza2);
                  const amount1 = Number(row.sellingPrice) * qty1;
                  const amount2 = Number(row.sellingPrice) * qty2;
                  const subtotalRow = amount1 + amount2;
                  const running = rows
                    .slice(0, rows.indexOf(row) + 1)
                    .reduce((sum, r) => sum + Number(r.sellingPrice) * (Number(r.uza1) + Number(r.uza2)), 0);
                  return (
                    <tr key={row.productId}>
                      <td className="py-2 px-2 font-bold text-slate-900 dark:text-slate-100 text-sm whitespace-nowrap">{row.productName}</td>
                      <td className="py-2 px-2 text-right text-sm font-semibold text-slate-500 tabular-nums">{formatCurrency(row.sellingPrice)}</td>
                      <td className="py-2 px-2 text-right text-sm font-semibold text-slate-700 tabular-nums">{qty1.toLocaleString()}</td>
                      <td className="py-2 px-2 text-right text-sm font-semibold text-slate-700 tabular-nums">{qty2.toLocaleString()}</td>
                      <td className="py-2 px-2 text-right text-sm font-bold text-brand-primary tabular-nums">{formatCurrency(subtotalRow)}</td>
                      <td className="py-2 px-2 text-right text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">{formatCurrency(running)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                  <td className="py-3 px-2 text-sm font-black text-slate-900 dark:text-slate-100" colSpan={4}>{t.grandTotal}</td>
                  <td className="py-3 px-2 text-right text-sm font-black text-brand-primary tabular-nums" colSpan={2}>{formatCurrency(totals.grand)}</td>
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
