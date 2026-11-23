import React, { useState, useCallback, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../components/common/PageHeader';
import PrintInvoice from '../components/billing/PrintInvoice';
import { productsApi } from '../api/products';
import { salesApi } from '../api/sales';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n);

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'upi', label: 'UPI', icon: '📱' },
  { value: 'card', label: 'Card', icon: '💳' },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
];

function calc(qty, price, discountAmount) {
  const lineSubtotal = qty * price;
  const applied = Math.min(Math.max(0, discountAmount), lineSubtotal);
  return parseFloat((lineSubtotal - applied).toFixed(2));
}

export default function SalesPage() {
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  const [cartItems, setCartItems] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [amountPaidEdited, setAmountPaidEdited] = useState(false);
  const [notes, setNotes] = useState('');
  const [commonDiscount, setCommonDiscount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [printSale, setPrintSale] = useState(null);
  const [showBill, setShowBill] = useState(false);

  const handleSearchChange = useCallback((value) => {
    setSearchInput(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (value.trim().length < 1) { setSearchResults([]); setShowDropdown(false); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await productsApi.searchProducts(value.trim());
        setSearchResults(results);
        setShowDropdown(true);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 300);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const addToCart = (product) => {
    if (product.currentStock <= 0) { toast.error(`"${product.name}" is out of stock`); return; }
    const existing = cartItems.find((i) => i.productId === product._id);
    if (existing) {
      if (existing.quantity >= product.currentStock) { toast.error(`Only ${product.currentStock} units available`); return; }
      setCartItems((prev) => prev.map((i) => i.productId === product._id
        ? { ...i, quantity: i.quantity + 1, lineTotal: calc(i.quantity + 1, i.unitPrice, i.discountAmount) } : i));
    } else {
      setCartItems((prev) => [...prev, {
        productId: product._id, productName: product.name, sku: product.sku, color: product.color,
        quantity: 1, unitPrice: product.sellingPrice, maxUnitPrice: product.sellingPrice,
        discountAmount: 0, lineTotal: product.sellingPrice, unit: product.unit, currentStock: product.currentStock,
      }]);
    }
    setSearchInput(''); setSearchResults([]); setShowDropdown(false);
  };

  const updateQty = (id, qty) => setCartItems((p) => p.map((i) => {
    if (i.productId !== id) return i;
    const discount = Math.min(i.discountAmount, qty * i.unitPrice);
    return { ...i, quantity: qty, discountAmount: discount, lineTotal: calc(qty, i.unitPrice, discount) };
  }));
  const updatePrice = (id, price) => setCartItems((p) => p.map((i) => {
    if (i.productId !== id) return i;
    const unitPrice = Math.min(Math.max(0, price), i.maxUnitPrice);
    const discount = Math.min(i.discountAmount, i.quantity * unitPrice);
    return { ...i, unitPrice, discountAmount: discount, lineTotal: calc(i.quantity, unitPrice, discount) };
  }));
  const updateDiscount = (id, discountAmount) => setCartItems((p) => p.map((i) =>
    i.productId === id ? { ...i, discountAmount, lineTotal: calc(i.quantity, i.unitPrice, discountAmount) } : i));
  const removeItem = (id) => setCartItems((p) => p.filter((i) => i.productId !== id));

  const subtotal = parseFloat(cartItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0).toFixed(2));
  const discountTotal = parseFloat(cartItems.reduce((s, i) => s + i.discountAmount, 0).toFixed(2));
  const commonDiscountAmt = parseFloat(Math.min(Math.max(parseFloat(commonDiscount) || 0, 0), Math.max(subtotal - discountTotal, 0)).toFixed(2));
  const grandTotal = parseFloat((subtotal - discountTotal - commonDiscountAmt).toFixed(2));
  const paid = Math.min(Math.max(parseFloat(amountPaid) || 0, 0), grandTotal);
  const balanceDue = parseFloat((grandTotal - paid).toFixed(2));

  useEffect(() => {
    if (!amountPaidEdited) { setAmountPaid(String(grandTotal)); return; }
    const entered = Number(amountPaid);
    if (amountPaid !== '' && Number.isFinite(entered) && entered > grandTotal) setAmountPaid(String(grandTotal));
  }, [amountPaid, amountPaidEdited, grandTotal]);

  const handleCreateBill = async () => {
    if (cartItems.length === 0) return;
    setSubmitting(true);
    try {
      const sale = await salesApi.createSale({
        customerName: customerName.trim() || 'Walk-in Customer',
        customerPhone: customerPhone.trim() || undefined,
        items: cartItems.map((i) => ({
          productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice,
          discount: i.discountAmount > 0 ? parseFloat(((i.discountAmount / (i.quantity * i.unitPrice)) * 100).toFixed(4)) : 0,
        })),
        commonDiscount: commonDiscountAmt > 0 ? commonDiscountAmt : undefined,
        paymentMethod, amountPaid: paid, notes: notes.trim() || undefined,
      });
      toast.success(`Bill ${sale.invoiceNumber} created!`);
      setPrintSale(sale);
      setShowBill(true);
      setCartItems([]); setCustomerName(''); setCustomerPhone(''); setNotes(''); setCommonDiscount(''); setAmountPaidEdited(false);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to create bill');
    } finally { setSubmitting(false); }
  };

  return (
    <div>
      <PageHeader title="New Bill" subtitle="Create a sale invoice" />

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {/* Left: Search + Cart */}
        <div className="lg:col-span-4 space-y-4">
          {/* Search */}
          <div className="card p-4">
            <p className="text-sm font-bold text-primary-600 mb-2 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              Search & Add Products
            </p>
            <div className="relative" ref={searchRef}>
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input className="input pl-9" placeholder="Type product name, SKU or brand…"
                value={searchInput} onChange={(e) => handleSearchChange(e.target.value)} />
              {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />}

              {showDropdown && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-72 overflow-y-auto">
                  {searchResults.map((o) => (
                    <button key={o._id} className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 flex items-center justify-between gap-3"
                      onClick={() => addToCart(o)}>
                      <div>
                        <p className="font-bold text-sm text-gray-800">{o.name}</p>
                        <p className="text-xs text-gray-400">
                          <span className="font-mono">{o.sku}</span>
                          {o.brand && ` · ${o.brand}`}
                          {o.color && ` · Color: ${o.color}`}
                          {' · '}
                          <span className={o.currentStock <= 0 ? 'text-red-500 font-semibold' : 'text-green-600 font-semibold'}>
                            {o.currentStock <= 0 ? 'Out of Stock' : `Stock: ${o.currentStock}`}
                          </span>
                        </p>
                      </div>
                      <span className="font-bold text-primary-600 shrink-0">{fmt(o.sellingPrice)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cart */}
          <div className="card overflow-hidden">
            <div className="px-4 py-2.5 bg-primary-50 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                <span className="text-sm font-bold text-primary-600">Cart</span>
                {cartItems.length > 0 && <span className="badge-primary">{cartItems.length} item{cartItems.length > 1 ? 's' : ''}</span>}
              </div>
              {cartItems.length > 0 && <button className="text-xs text-red-500 hover:text-red-700 font-semibold" onClick={() => setCartItems([])}>Clear All</button>}
            </div>

            {cartItems.length === 0 ? (
              <div className="py-12 text-center">
                <svg className="w-12 h-12 text-gray-200 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                <p className="font-semibold text-gray-500">Cart is empty</p>
                <p className="text-sm text-gray-400">Search and add products above</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-bold uppercase text-gray-400">Product</th>
                        <th className="px-2 py-2 text-center text-xs font-bold uppercase text-gray-400 w-28">Qty</th>
                        <th className="px-2 py-2 text-right text-xs font-bold uppercase text-gray-400 w-24">Rate</th>
                        <th className="px-2 py-2 text-right text-xs font-bold uppercase text-gray-400 w-24">Disc ₹</th>
                        <th className="px-3 py-2 text-right text-xs font-bold uppercase text-gray-400 w-24">Total</th>
                        <th className="w-8" />
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((item) => (
                        <tr key={item.productId} className="border-b border-gray-50">
                          <td className="px-3 py-2">
                            <p className="font-bold text-gray-800">{item.productName}</p>
                            <p className="text-xs text-gray-400">
                              <span className="font-mono">{item.sku}</span> · {item.unit}
                              {item.color && ` · Color: ${item.color}`}
                              {' '}
                              <span className={item.currentStock <= item.quantity ? 'text-yellow-600' : 'text-gray-400'}>
                                ({item.currentStock} left)
                              </span>
                            </p>
                          </td>
                          <td className="px-2 py-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                                onClick={() => item.quantity > 1 && updateQty(item.productId, item.quantity - 1)}>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><line x1="5" y1="12" x2="19" y2="12"/></svg>
                              </button>
                              <input type="number" value={item.quantity} min={1} max={item.currentStock}
                                className="w-10 text-center text-sm font-bold border border-gray-200 rounded py-0.5"
                                onChange={(e) => {
                                  const v = parseInt(e.target.value) || 1;
                                  if (v > item.currentStock) { toast.error(`Max: ${item.currentStock}`); return; }
                                  updateQty(item.productId, Math.max(1, v));
                                }} />
                              <button className="w-6 h-6 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                                onClick={() => { if (item.quantity < item.currentStock) updateQty(item.productId, item.quantity + 1); else toast.error(`Max: ${item.currentStock}`); }}>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                              </button>
                            </div>
                          </td>
                          <td className="px-2 py-2">
                            <input type="number" value={item.unitPrice} min={0} max={item.maxUnitPrice} step="0.01"
                              className="w-20 text-right text-sm font-semibold border border-gray-200 rounded px-2 py-1"
                              onChange={(e) => updatePrice(item.productId, parseFloat(e.target.value) || 0)} />
                          </td>
                          <td className="px-2 py-2">
                            <input type="number" value={item.discountAmount || ''} min={0} step="0.01"
                              className="w-20 text-right text-sm border border-gray-200 rounded px-2 py-1"
                              onChange={(e) => updateDiscount(item.productId, Math.min(item.quantity * item.unitPrice, Math.max(0, parseFloat(e.target.value) || 0)))} />
                          </td>
                          <td className="px-3 py-2 text-right font-bold text-primary-600">{fmt(item.lineTotal)}</td>
                          <td className="pr-2">
                            <button className="icon-btn text-red-400 hover:bg-red-50" onClick={() => removeItem(item.productId)}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Cart footer */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Common Discount:</span>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                      <input type="number" value={commonDiscount} min={0} step="0.01" placeholder="0"
                        className="input-sm pl-6 w-28"
                        onChange={(e) => { const v = e.target.value; if (v === '' || /^\d*\.?\d*$/.test(v)) setCommonDiscount(v); }}
                        onBlur={(e) => { const v = parseFloat(e.target.value) || 0; const max = Math.max(subtotal - discountTotal, 0); setCommonDiscount(v > 0 ? String(Math.min(v, max)) : ''); }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">Subtotal: <strong>{fmt(subtotal)}</strong></span>
                    {(discountTotal > 0 || commonDiscountAmt > 0) && (
                      <span className="text-green-600">Discount: <strong>-{fmt(discountTotal + commonDiscountAmt)}</strong></span>
                    )}
                    <span className="font-bold">Total: <span className="text-primary-600">{fmt(grandTotal)}</span></span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right: Summary + Checkout */}
        <div className="lg:col-span-3">
          <div className="card overflow-hidden sticky top-20">
            <div className="px-4 py-3 bg-primary-600 flex items-center gap-2">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12h6m-3-3v6"/></svg>
              <span className="text-white font-bold text-sm">Bill Summary</span>
            </div>

            <div className="p-4 space-y-4">
              {/* Customer */}
              <div>
                <p className="text-xs font-bold text-primary-600 uppercase tracking-wide mb-2">Customer</p>
                <div className="space-y-2">
                  <input className="input" placeholder="Customer Name (Walk-in)" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                  <input className="input" placeholder="Phone (optional)" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                </div>
              </div>

              <hr />

              {/* Totals */}
              <div className="bg-primary-50 rounded-xl p-3 space-y-1.5 border border-primary-100 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-semibold">{fmt(subtotal)}</span></div>
                {discountTotal > 0 && <div className="flex justify-between"><span className="text-green-600">Item Discounts</span><span className="font-semibold text-green-600">− {fmt(discountTotal)}</span></div>}
                {commonDiscountAmt > 0 && <div className="flex justify-between"><span className="text-green-600">Common Discount</span><span className="font-semibold text-green-600">− {fmt(commonDiscountAmt)}</span></div>}
                <hr className="border-primary-200" />
                <div className="flex justify-between items-center">
                  <span className="font-bold">Grand Total</span>
                  <span className="text-xl font-extrabold text-primary-600">{fmt(grandTotal)}</span>
                </div>
              </div>

              <hr />

              {/* Payment method */}
              <div>
                <p className="text-xs font-bold text-primary-600 uppercase tracking-wide mb-2">Payment Method</p>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button key={m.value}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${paymentMethod === m.value ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'}`}
                      onClick={() => setPaymentMethod(m.value)}>
                      {m.icon} {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount paid */}
              <div>
                <label className="label">Amount Paid (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                  <input type="number" className="input pl-7" min={0} max={grandTotal} step="0.01"
                    value={amountPaid}
                    onChange={(e) => {
                      const v = e.target.value;
                      setAmountPaidEdited(true);
                      if (v === '') { setAmountPaid(''); return; }
                      const n = Number(v);
                      if (Number.isFinite(n)) setAmountPaid(n > grandTotal ? String(grandTotal) : v);
                    }}
                    onBlur={(e) => { const n = Number(e.target.value); setAmountPaid(String(Math.min(Math.max(Number.isFinite(n) ? n : 0, 0), grandTotal))); }} />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary-600 hover:underline"
                    onClick={() => setAmountPaid(String(grandTotal))}>Full</button>
                </div>
              </div>

              {/* Balance */}
              {(paid > 0 || grandTotal > 0) && (
                <div className={`rounded-xl p-3 flex justify-between items-center ${balanceDue > 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                  <span className={`font-bold text-sm ${balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {balanceDue < 0 ? 'Change to Return' : 'Balance Due'}
                  </span>
                  <span className={`font-extrabold text-base ${balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {balanceDue < 0 ? fmt(Math.abs(balanceDue)) : fmt(Math.max(0, balanceDue))}
                  </span>
                </div>
              )}

              {/* Notes */}
              <textarea className="input text-sm" rows={2} placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />

              {/* Submit */}
              <button className="btn-primary w-full btn-lg text-base font-bold"
                disabled={cartItems.length === 0 || submitting}
                onClick={handleCreateBill}>
                {submitting
                  ? <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating…</>
                  : `Create Bill — ${fmt(grandTotal)}`}
              </button>
            </div>
          </div>
        </div>
      </div>

      <PrintInvoice open={showBill} sale={printSale} onClose={() => setShowBill(false)} />
    </div>
  );
}
