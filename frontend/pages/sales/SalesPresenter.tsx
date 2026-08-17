import React from 'react';
import {
  Search, Plus, Minus, Trash2, User, Clock, Wine, UtensilsCrossed,
  Pizza, Fish as FishIcon, Soup, Beer, ShoppingBag, Flame, Printer,
  CreditCard, CheckCircle, X, ChevronDown, MinusCircle, PlusCircle,
  Package, ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/utils';
import { type Language, translations } from '../../lib/i18n';
import { type Product } from './SalesContainer';
import { type CartItem } from '../../hooks/useCart';
import { type OrderType } from './SalesContainer';
import LoadingSpinner from '../../components/LoadingSpinner';

interface CartReturn {
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

interface SalesPresenterProps {
  lang: Language;
  t: (typeof translations)[Language];
  products: Product[];
  allProducts: Product[];
  loading: boolean;
  searchTerm: string;
  onSearchChange: (v: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (v: any) => void;
  categories: readonly string[];
  cart: CartReturn;
  onAddToOrder: (product: Product) => void;
  orderType: OrderType;
  onOrderTypeChange: (v: OrderType) => void;
  tableNumber: string;
  onTableNumberChange: (v: string) => void;
  customerName: string;
  onCustomerNameChange: (v: string) => void;
  orderNumber: number;
  onPrint: () => void;
  onFire: () => void;
  onCharge: () => void;
  showFireConfirm: boolean;
  showPaymentSuccess: boolean;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  all: Package,
  beer: Beer,
  spirits: Wine,
  soft_drinks: UtensilsCrossed,
  water: UtensilsCrossed,
};

const ORDER_TYPES: { key: OrderType; labelKey: string }[] = [
  { key: 'dine_in', labelKey: 'dineIn' },
  { key: 'takeout', labelKey: 'takeout' },
  { key: 'curbside', labelKey: 'curbside' },
];

const CATEGORY_LABELS: Record<string, string> = {
  beer: 'Bar',
  spirits: 'Bar',
  soft_drinks: 'Drinks',
  water: 'Drinks',
};

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export function SalesPresenter({
  lang, t, products, allProducts, loading, searchTerm, onSearchChange,
  categoryFilter, onCategoryFilterChange, categories,
  cart, onAddToOrder,
  orderType, onOrderTypeChange,
  tableNumber, onTableNumberChange,
  customerName, onCustomerNameChange,
  orderNumber, onPrint, onFire, onCharge,
  showFireConfirm, showPaymentSuccess,
}: SalesPresenterProps) {
  const now = new Date();
  const chargeTotal = cart.total;

  return (
    <div className="flex h-full bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-300">

      {/* ===================== LEFT: MENU SECTION ===================== */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200/60 dark:border-slate-800">
        {/* Search + Categories */}
        <div className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 sm:px-6 py-4 space-y-4">
          {/* Search */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder={t.searchProducts}
              className="w-full h-12 pl-12 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-300 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-500 dark:text-slate-200"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => {
              const Icon = CATEGORY_ICONS[cat] || Package;
              const isActive = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => onCategoryFilterChange(cat)}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shrink-0 border',
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-300',
                  )}
                >
                  <Icon size={15} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="uppercase tracking-wider">{cat === 'all' ? t.all : (t[cat as keyof typeof t] || cat)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 no-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <LoadingSpinner size={48} thickness={200} speed={75} color="#10b981" secondaryColor="rgba(16, 185, 129, 0.3)" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 mb-4">
                <ShoppingBag size={28} />
              </div>
              <p className="text-sm font-bold text-slate-400 dark:text-slate-500">No products found</p>
              <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">Try a different search or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
              {products.map((product) => {
                const isLowStock = product.quantity > 0 && product.quantity <= 5;
                const productInCart = cart.items.find((i) => i.productId === product.id);

                return (
                  <motion.button
                    key={product.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onAddToOrder(product)}
                    className="group relative bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-4 text-left transition-all hover:border-emerald-200 dark:hover:border-emerald-800 hover:shadow-lg hover:shadow-emerald-900/5 cursor-pointer"
                  >
                    {/* Product image placeholder / icon */}
                    <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 flex items-center justify-center mb-3 overflow-hidden">
                      <ShoppingBag size={32} className="text-emerald-300 dark:text-emerald-700" strokeWidth={1.5} />
                    </div>

                    {/* Info */}
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-tight line-clamp-2 min-h-[2.5rem]">
                      {product.name}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-base font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {formatCurrency(product.selling_price)}
                      </span>
                      {isLowStock && (
                        <span className="text-[8px] font-black uppercase tracking-widest text-amber-500 bg-amber-50 dark:bg-amber-950/30 px-1.5 py-0.5 rounded-md">
                          Low
                        </span>
                      )}
                    </div>

                    {/* ADD button */}
                    <div className="mt-3 flex items-center justify-center h-9 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-widest transition-all shadow-sm shadow-emerald-200 dark:shadow-none">
                      <Plus size={14} className="mr-1" />
                      {t.addToOrder}
                    </div>

                    {/* Cart quantity badge */}
                    {productInCart && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center shadow-md">
                        {productInCart.quantity}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ===================== RIGHT: ORDER PANEL ===================== */}
      <div className="w-[340px] lg:w-[380px] shrink-0 flex flex-col bg-white dark:bg-slate-900 overflow-hidden transition-colors duration-300">

        {/* Order Header */}
        <div className="shrink-0 px-5 py-4 border-b border-slate-100 dark:border-slate-800 space-y-4">
          {/* Date/Time + User */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-slate-300 dark:text-slate-600" />
              <div>
                <p className="text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">{formatDate(now)}</p>
                <p className="text-xs font-black text-slate-700 dark:text-slate-200 tabular-nums">{formatTime(now)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                <User size={14} className="text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Table + Customer */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest mb-1 block">{t.table}</label>
              <div className="relative">
                <select
                  value={tableNumber}
                  onChange={(e) => onTableNumberChange(e.target.value)}
                  className="w-full h-9 pl-3 pr-8 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 appearance-none cursor-pointer"
                >
                  {Array.from({ length: 20 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                      {t.table} {String(i + 1).padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest mb-1 block">{t.customer}</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => onCustomerNameChange(e.target.value)}
                placeholder={lang === 'en' ? 'Customer name' : 'Jina la mteja'}
                className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 placeholder:text-slate-300 dark:placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Order Type Buttons */}
          <div className="grid grid-cols-3 gap-2">
            {ORDER_TYPES.map((ot) => (
              <button
                key={ot.key}
                onClick={() => onOrderTypeChange(ot.key)}
                className={cn(
                  'h-9 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border',
                  orderType === ot.key
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-200 dark:shadow-none'
                    : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700',
                )}
              >
                {ot.labelKey === 'dineIn' ? t.dineIn : ot.labelKey === 'takeout' ? t.takeout : t.curbside}
              </button>
            ))}
          </div>

          {/* Order Number + Item Count */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">{t.orderNumber}</span>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">#{orderNumber}</span>
            </div>
            <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">
              {cart.itemCount} {t.items}
            </span>
          </div>
        </div>

        {/* Order Items - Scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-3 no-scrollbar">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-14 h-14 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-200 dark:text-slate-700 mb-3">
                <ShoppingBag size={24} />
              </div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500">{t.emptyOrder}</p>
              <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1 max-w-[200px]">{t.emptyOrderDesc}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-xl p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 dark:text-emerald-400">
                        {CATEGORY_LABELS[item.category] || item.category}
                      </span>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{item.name}</p>
                    </div>
                    <button
                      onClick={() => cart.removeItem(item.id)}
                      className="p-1 rounded-lg text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-700 p-0.5">
                      <button
                        onClick={() => cart.updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all"
                      >
                        <MinusCircle size={16} />
                      </button>
                      <span className="w-7 text-center text-sm font-black text-slate-800 dark:text-slate-100 tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => cart.updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all"
                      >
                        <PlusCircle size={16} />
                      </button>
                    </div>

                    {/* Line Total */}
                    <span className="text-sm font-black text-slate-800 dark:text-slate-100 tabular-nums">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Billing + Actions */}
        <div className="shrink-0 border-t border-slate-100 dark:border-slate-800 px-5 py-4 space-y-3">
          {/* Billing Lines */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{t.subtotal}</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 tabular-nums">{formatCurrency(cart.subtotal)}</span>
            </div>
            {cart.discount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{t.discount}</span>
                <span className="text-xs font-bold text-red-500 tabular-nums">-{formatCurrency(cart.discount)}</span>
              </div>
            )}
            {cart.serviceCharge > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{t.serviceCharge}</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 tabular-nums">{formatCurrency(cart.serviceCharge)}</span>
              </div>
            )}
            {cart.taxRate > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{t.tax} ({cart.taxRate}%)</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 tabular-nums">{formatCurrency(cart.tax)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">{t.total}</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{formatCurrency(chargeTotal)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onPrint}
              disabled={cart.items.length === 0}
              className="h-11 rounded-xl border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-emerald-50 dark:hover:bg-emerald-950/20 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Printer size={14} />
              {t.print}
            </button>
            <button
              onClick={onFire}
              disabled={cart.items.length === 0}
              className="h-11 rounded-xl bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest transition-all hover:bg-brand-dark shadow-sm shadow-orange-200 dark:shadow-none active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Flame size={14} />
              {t.fire}
            </button>
          </div>

          {/* Charge Button */}
          <button
            onClick={onCharge}
            disabled={cart.items.length === 0}
            className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-200 dark:shadow-none active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <CreditCard size={18} />
            <span>{t.charge} {formatCurrency(chargeTotal)}</span>
          </button>
        </div>
      </div>

      {/* ===================== FIRE CONFIRMATION OVERLAY ===================== */}
      <AnimatePresence>
        {showFireConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/20 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-10 shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-5"
            >
              <div className="w-20 h-20 rounded-full bg-brand-primary text-white flex items-center justify-center shadow-xl shadow-orange-200 dark:shadow-none">
                <Flame size={40} strokeWidth={2.5} />
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-slate-800 dark:text-slate-100">{t.orderSent}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{t.orderSentDesc}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================== PAYMENT SUCCESS OVERLAY ===================== */}
      <AnimatePresence>
        {showPaymentSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/20 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-10 shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center gap-5"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-200 dark:shadow-none">
                <CheckCircle size={40} strokeWidth={2.5} />
              </div>
              <div className="text-center">
                <p className="text-xl font-black text-slate-800 dark:text-slate-100">{t.saleConfirmed}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{t.transactionSuccessful}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
