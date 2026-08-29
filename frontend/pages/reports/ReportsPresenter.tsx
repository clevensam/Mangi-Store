import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Calculator, ChevronLeft, ChevronRight, FileText, Plus, Pencil, RefreshCw, Trash2, X } from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import type { StockRow, WeekDay, CellField, SaveStatus } from './ReportsContainer';

const WEEKDAY_KEY = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const DAY_LABEL_KEYS: { field: CellField }[] = [
  { field: 'in' },
  { field: 'jumla' },
  { field: 'uza' },
  { field: 'baki' },
];
const CATEGORIES = ['beer', 'spirits', 'soft_drinks', 'water'] as const;

interface ProductForm {
  name: string;
  category: string;
  buying_price: number;
  selling_price: number;
}

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
  saveStatus: SaveStatus;
  onAddProduct: (data: ProductForm) => Promise<boolean>;
  onEditProduct: (id: string, data: ProductForm) => Promise<boolean>;
  onDeleteProduct: (id: string) => Promise<boolean>;
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

function CustomScrollBar({ targetRef }: { targetRef: React.RefObject<HTMLDivElement | null> }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [thumb, setThumb] = useState({ left: 0, width: 0, visible: false });
  const [dragging, setDragging] = useState(false);

  const update = useCallback(() => {
    const el = targetRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const vis = max > 0;
    const trackW = trackRef.current ? trackRef.current.clientWidth : 0;
    const w = vis && trackW > 0 ? Math.max(40, (el.clientWidth / el.scrollWidth) * trackW) : 0;
    const left = vis && max > 0 ? (el.scrollLeft / max) * (trackW - w) : 0;
    setThumb({ left, width: w, visible: vis });
  }, [targetRef]);

  useEffect(() => {
    const el = targetRef.current;
    if (!el) return;
    update();
    const onScroll = () => update();
    el.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onScroll);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onScroll) : null;
    ro?.observe(el);
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      ro?.disconnect();
    };
  }, [targetRef, update]);

  const jumpTo = (e: React.PointerEvent) => {
    const el = targetRef.current;
    const track = trackRef.current;
    if (!el || !track) return;
    const max = el.scrollWidth - el.clientWidth;
    const trackW = track.clientWidth;
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / trackW));
    el.scrollLeft = ratio * max;
  };

  const startDrag = (e: React.PointerEvent) => {
    const el = targetRef.current;
    const track = trackRef.current;
    if (!el || !track) return;
    e.preventDefault();
    setDragging(true);
    const startX = e.clientX;
    const startLeft = el.scrollLeft;
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const max = el.scrollWidth - el.clientWidth;
      const trackW = track.clientWidth;
      const w = thumb.width;
      const scale = max / (trackW - w);
      el.scrollLeft = startLeft + dx * scale;
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  if (!thumb.visible) return null;

  return (
    <div
      ref={trackRef}
      onPointerDown={jumpTo}
      className="h-3.5 flex items-center px-1 cursor-pointer select-none bg-slate-100 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700"
    >
      <div
        onPointerDown={startDrag}
        style={{ left: thumb.left, width: thumb.width }}
        className={cn(
          'relative h-1.5 rounded-full transition-colors',
          dragging ? 'bg-brand-primary' : 'bg-slate-400 dark:bg-slate-500 hover:bg-brand-primary',
        )}
      />
    </div>
  );
}

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
  saveStatus,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
}: ReportsPresenterProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<{ id: string; name: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [productForm, setProductForm] = useState<ProductForm>({
    name: '',
    category: 'beer',
    buying_price: 0,
    selling_price: 0,
  });
  const tableScrollRef = useRef<HTMLDivElement | null>(null);

  const openProductForm = (product?: StockRow) => {
    if (product) {
      setEditingProduct({ id: product.productId, name: product.productName });
      setProductForm({
        name: product.productName,
        category: product.category ?? 'beer',
        buying_price: product.buyingPrice,
        selling_price: product.sellingPrice,
      });
    } else {
      setEditingProduct(null);
      setProductForm({ name: '', category: 'beer', buying_price: 0, selling_price: 0 });
    }
    setProductModalOpen(true);
  };

  const submitProduct = async () => {
    if (!productForm.name.trim()) return;
    setBusy(true);
    const data: ProductForm = {
      name: productForm.name.trim(),
      category: productForm.category,
      buying_price: productForm.buying_price,
      selling_price: productForm.selling_price,
    };
    const ok = editingProduct
      ? await onEditProduct(editingProduct.id, data)
      : await onAddProduct(data);
    setBusy(false);
    if (ok) {
      setProductModalOpen(false);
      setEditingProduct(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setConfirmingDelete(true);
    const ok = await onDeleteProduct(deleteTarget.id);
    setConfirmingDelete(false);
    if (ok) setDeleteTarget(null);
  };

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
              <span
                title={t.autoSave}
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors',
                  saveStatus === 'saving'
                    ? 'text-slate-500 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    : saveStatus === 'error'
                      ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900'
                      : saveStatus === 'saved'
                        ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900'
                        : 'text-slate-400 bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-700',
                )}
              >
                <span className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  saveStatus === 'saving' ? 'bg-slate-400 animate-pulse' : saveStatus === 'error' ? 'bg-rose-500' : saveStatus === 'saved' ? 'bg-emerald-500' : 'bg-slate-300',
                )} />
                {saveStatus === 'saving' ? t.saving : saveStatus === 'error' ? t.saveError : saveStatus === 'saved' ? t.saved : t.autoSave}
              </span>
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
                onClick={() => openProductForm()}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all"
              >
                <Plus size={15} />
                {t.addProduct}
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

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-6 lg:px-8 pb-8">
        <div className="mx-auto w-full max-w-[1280px]">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div ref={tableScrollRef} className="overflow-x-auto no-scrollbar">
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
                          'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 sm:px-3 py-1.5 whitespace-nowrap uppercase text-[11px] sm:text-xs font-black text-slate-700 dark:text-slate-300',
                        )}
                      >
                        <span className="flex items-center gap-1.5">
                          <span className="truncate">{row.productName}</span>
                          <span className="inline-flex items-center gap-0.5">
                            <button
                              onClick={() => openProductForm(row)}
                              title={t.editProduct}
                              className="p-1 rounded-md text-slate-400 hover:text-brand-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ id: row.productId, name: row.productName })}
                              title={t.deleteProduct}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </span>
                        </span>
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
            <CustomScrollBar targetRef={tableScrollRef} />
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

      <Modal isOpen={productModalOpen} onClose={() => setProductModalOpen(false)} size="md">
        <Modal.Header>
          <Modal.TitleGroup>
            <Modal.Subtitle>{editingProduct ? editingProduct.name : t.stockSheet}</Modal.Subtitle>
            <Modal.Title>{editingProduct ? t.editProduct : t.addProduct}</Modal.Title>
          </Modal.TitleGroup>
          <Modal.CloseButton onClick={() => setProductModalOpen(false)} />
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t.productName}</label>
              <input
                type="text"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/20 font-bold text-slate-800 dark:text-slate-100 text-sm"
                placeholder={t.productName}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t.category}</label>
              <div className="grid grid-cols-2 gap-1.5">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setProductForm({ ...productForm, category: c })}
                    className={cn(
                      'px-3 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border',
                      productForm.category === c
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-700',
                    )}
                  >
                    {t[c] || c}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t.buyingPrice}</label>
                <input
                  type="number"
                  min={0}
                  value={productForm.buying_price}
                  onChange={(e) => setProductForm({ ...productForm, buying_price: e.target.valueAsNumber || 0 })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/20 font-bold text-slate-800 dark:text-slate-100 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{t.sellingPrice}</label>
                <input
                  type="number"
                  min={0}
                  value={productForm.selling_price}
                  onChange={(e) => setProductForm({ ...productForm, selling_price: e.target.valueAsNumber || 0 })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-brand-primary/5 focus:border-brand-primary/20 font-bold text-slate-800 dark:text-slate-100 text-sm"
                />
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setProductModalOpen(false)}
              className="py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm transition-colors"
            >
              {t.cancel}
            </button>
            <button
              onClick={submitProduct}
              disabled={busy || !productForm.name.trim()}
              className="py-3 rounded-xl bg-gradient-brand text-white font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {editingProduct ? t.save : t.addProduct}
            </button>
          </div>
        </Modal.Footer>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} size="sm">
        <Modal.Header>
          <Modal.Title>{t.deleteProduct}</Modal.Title>
          <Modal.CloseButton onClick={() => setDeleteTarget(null)} />
        </Modal.Header>
        <Modal.Body>
          <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
            {t.confirmDelete} <span className="font-black text-slate-900 dark:text-white uppercase">{deleteTarget?.name}</span>
          </p>
        </Modal.Body>
        <Modal.Footer>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              className="py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm transition-colors"
            >
              {t.cancel}
            </button>
            <button
              onClick={confirmDelete}
              disabled={confirmingDelete}
              className="py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {confirmingDelete ? t.saving : t.deleteProduct}
            </button>
          </div>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

function num(v: number | undefined | null): number {
  return Number.isFinite(v) ? Number(v) : 0;
}
