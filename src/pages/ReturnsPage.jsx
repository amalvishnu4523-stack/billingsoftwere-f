import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../components/common/PageHeader';
import { returnsApi } from '../api/returns';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n);

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Completed', value: 'completed' },
  { label: 'Approved', value: 'approved' },
  { label: 'Draft', value: 'draft' },
  { label: 'Rejected', value: 'rejected' },
];

const REFUND_METHODS = ['cash', 'upi', 'card', 'bank_transfer', 'store_credit'];

const RETURN_REASONS = [
  'Defective / Damaged', 'Wrong Item Purchased / Shipped',
  'Customer Changed Mind', 'Not Satisfied with Quality',
  'Size / Specification Mismatch', 'Other',
];

const statusCls = { completed: 'badge-success', approved: 'badge-info', draft: 'badge-warning', rejected: 'badge-error' };
const condCls   = { resellable: 'badge-success', damaged: 'badge-error', supplier_return: 'badge-warning' };
const condLabel = { resellable: 'Resellable', damaged: 'Damaged', supplier_return: 'Supplier Return' };

export default function ReturnsPage() {
  const [searchParams] = useSearchParams();
  const [returns, setReturns] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const rowsPerPage = 20;
  const [stats, setStats] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewReturn, setViewReturn] = useState(null);
  const [invoiceLookup, setInvoiceLookup] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [saleInfo, setSaleInfo] = useState(null);
  const [itemSelections, setItemSelections] = useState({});
  const [refundMethod, setRefundMethod] = useState('cash');
  const [returnNotes, setReturnNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await returnsApi.getReturns({ search: search || undefined, status: statusFilter || undefined, page: page + 1, pageSize: rowsPerPage });
      setReturns(res.data); setTotal(res.pagination.total);
    } catch { toast.error('Failed to load returns'); }
    finally { setLoading(false); }
  }, [search, statusFilter, page]);

  const fetchStats = useCallback(async () => {
    try { setStats(await returnsApi.getReturnStats()); } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchReturns(); }, [fetchReturns]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  useEffect(() => {
    const inv = searchParams.get('invoiceId');
    if (inv) { setInvoiceLookup(inv); handleLookupInvoice(inv); setCreateOpen(true); }
  }, [searchParams]);

  const handleLookupInvoice = async (customInv) => {
    const inv = (customInv || invoiceLookup).trim();
    if (!inv) { toast.error('Enter an invoice number'); return; }
    setLookingUp(true);
    try {
      const info = await returnsApi.getSaleReturnableInfo(inv);
      setSaleInfo(info);
      setRefundMethod(info.sale.paymentMethod || 'cash');
      const initial = {};
      info.items.forEach((item) => {
        initial[item.productId] = { selected: item.returnableQuantity > 0, quantity: item.returnableQuantity > 0 ? 1 : 0, condition: 'resellable', reason: RETURN_REASONS[0] };
      });
      setItemSelections(initial);
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Invoice not found');
      setSaleInfo(null);
    } finally { setLookingUp(false); }
  };

  const openCreate = () => { setInvoiceLookup(''); setSaleInfo(null); setItemSelections({}); setReturnNotes(''); setCreateOpen(true); };

  const computedRefundTotal = saleInfo
    ? saleInfo.items.reduce((acc, item) => {
        const sel = itemSelections[item.productId];
        return sel?.selected && sel?.quantity > 0 ? acc + sel.quantity * item.unitPrice : acc;
      }, 0)
    : 0;

  const handleConfirmReturn = async () => {
    if (!saleInfo) return;
    const payload = saleInfo.items
      .filter((item) => itemSelections[item.productId]?.selected && itemSelections[item.productId]?.quantity > 0)
      .map((item) => {
        const sel = itemSelections[item.productId];
        return { saleItem: item.saleItemId, product: item.productId, quantity: sel.quantity, unitPrice: item.unitPrice, condition: sel.condition, returnReason: sel.reason };
      });
    if (!payload.length) { toast.error('Select at least one item to return'); return; }
    setSubmitting(true);
    try {
      const res = await returnsApi.createReturn({ originalSale: saleInfo.sale._id, items: payload, refundMethod, notes: returnNotes.trim() || undefined, status: 'completed', refundStatus: 'completed' });
      toast.success(`Return ${res.returnNumber} processed!`);
      setCreateOpen(false);
      fetchReturns(); fetchStats();
      setViewReturn(res);
    } catch (err) { toast.error(err?.response?.data?.message ?? 'Failed to process return'); }
    finally { setSubmitting(false); }
  };

  const totalPages = Math.ceil(total / rowsPerPage);

  return (
    <div>
      <PageHeader title="Returns" subtitle="Process customer returns and manage refunds"
        actions={<button className="btn-primary btn-sm" onClick={openCreate}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Process Return
        </button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Total Returns', value: stats?.totalReturns ?? 0, sub: `${stats?.completedCount ?? 0} completed`, cls: 'text-primary-600 bg-primary-50' },
          { label: 'Total Refunded', value: fmt(stats?.totalRefundAmount ?? 0), sub: 'Refunds issued', cls: 'text-red-600 bg-red-50' },
          { label: 'Restocked Items', value: `${stats?.resellableRestockedQty ?? 0} units`, sub: 'Back to inventory', cls: 'text-green-600 bg-green-50' },
          { label: 'Items Returned', value: `${stats?.totalItemsReturned ?? 0} lines`, sub: 'Across all returns', cls: 'text-blue-600 bg-blue-50' },
        ].map((c) => (
          <div key={c.label} className="card p-4">
            <p className="text-xs font-bold text-gray-400 uppercase mb-1">{c.label}</p>
            <p className={`text-xl font-bold ${c.cls.split(' ')[0]}`}>{c.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 items-start sm:items-center">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input className="input pl-9 w-72" placeholder="Search by return #, invoice # or customer…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button key={f.value}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${statusFilter === f.value ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'}`}
              onClick={() => { setStatusFilter(statusFilter === f.value && f.value !== '' ? '' : f.value); setPage(0); }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Return #</th><th>Date</th><th>Invoice #</th><th>Customer</th>
                <th>Items</th><th className="text-right">Refund</th><th className="text-center">Method</th><th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10">
                  <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : returns.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-400">
                  {search ? 'No returns match your search' : 'No return records found'}
                </td></tr>
              ) : returns.map((r) => (
                <tr key={r._id} onClick={() => setViewReturn(r)}>
                  <td><span className="font-mono text-xs font-bold text-primary-600">{r.returnNumber}</span></td>
                  <td>
                    <p className="text-sm font-semibold">{new Date(r.returnDate || r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    <p className="text-xs text-gray-400">{new Date(r.returnDate || r.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                  </td>
                  <td className="font-semibold text-sm">{r.originalSale?.invoiceNumber ?? '—'}</td>
                  <td className="font-semibold text-sm">{r.customer?.name || r.originalSale?.customerName || 'Walk-in Customer'}</td>
                  <td className="text-sm">
                    {r.items.reduce((s, i) => s + i.quantity, 0)} units ({r.items.length})
                    <div className="flex gap-1 mt-0.5">
                      {r.items.some((i) => i.condition === 'resellable') && <span className="badge-success text-[10px]">Restocked</span>}
                      {r.items.some((i) => i.condition === 'damaged') && <span className="badge-error text-[10px]">Damaged</span>}
                    </div>
                  </td>
                  <td className="text-right font-bold text-red-600">{fmt(r.totalRefund)}</td>
                  <td className="text-center"><span className="badge-default text-xs">{(r.refundMethod || 'CASH').toUpperCase()}</span></td>
                  <td className="text-center"><span className={statusCls[r.status] ?? 'badge-default'}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <span>{total} returns</span>
          <div className="flex items-center gap-2">
            <button className="icon-btn" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span>{page + 1} / {Math.max(1, totalPages)}</span>
            <button className="icon-btn" disabled={page + 1 >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Process Return Modal */}
      {createOpen && (
        <div className="modal-overlay" onClick={() => setCreateOpen(false)}>
          <div className="modal-box max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header bg-primary-600 text-white">
              <div>
                <h2 className="font-bold">Process Customer Return</h2>
                <p className="text-xs opacity-80">Lookup sale, select items, restock, issue refund</p>
              </div>
              <button className="text-white/80 hover:text-white" onClick={() => setCreateOpen(false)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="modal-body space-y-5">
              {/* Step 1 */}
              <div>
                <p className="text-xs font-bold text-primary-600 uppercase tracking-wide mb-2">1. Invoice Lookup</p>
                <div className="flex gap-2">
                  <input className="input flex-1" placeholder="Enter invoice number (e.g. INV-00001)"
                    value={invoiceLookup} onChange={(e) => setInvoiceLookup(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleLookupInvoice(); }} />
                  <button className="btn-primary btn-sm min-w-[100px]" onClick={() => handleLookupInvoice()} disabled={lookingUp || !invoiceLookup.trim()}>
                    {lookingUp ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Find Invoice'}
                  </button>
                </div>
              </div>

              {saleInfo && (
                <>
                  {/* Sale info */}
                  <div className="bg-gray-50 rounded-xl p-3 text-sm">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div><p className="text-xs text-gray-400">Invoice</p><p className="font-bold font-mono">{saleInfo.sale.invoiceNumber}</p></div>
                      <div><p className="text-xs text-gray-400">Customer</p><p className="font-bold">{saleInfo.sale.customerName}</p></div>
                      <div><p className="text-xs text-gray-400">Date</p><p className="font-bold">{new Date(saleInfo.sale.invoiceDate).toLocaleDateString('en-IN')}</p></div>
                      <div><p className="text-xs text-gray-400">Total</p><p className="font-bold text-primary-600">{fmt(saleInfo.sale.grandTotal)}</p></div>
                    </div>
                  </div>

                  {/* Step 2: Items */}
                  <div>
                    <p className="text-xs font-bold text-primary-600 uppercase tracking-wide mb-2">2. Select Items to Return</p>
                    <div className="space-y-2">
                      {saleInfo.items.map((item) => {
                        const sel = itemSelections[item.productId] ?? { selected: false, quantity: 0, condition: 'resellable', reason: RETURN_REASONS[0] };
                        const updateSel = (patch) => setItemSelections((prev) => ({ ...prev, [item.productId]: { ...sel, ...patch } }));
                        return (
                          <div key={item.productId} className={`border rounded-xl p-3 transition ${sel.selected ? 'border-primary-300 bg-primary-50/50' : 'border-gray-200'}`}>
                            <div className="flex items-center gap-3 mb-2">
                              <input type="checkbox" checked={sel.selected} disabled={item.returnableQuantity === 0}
                                onChange={(e) => updateSel({ selected: e.target.checked, quantity: e.target.checked ? 1 : 0 })}
                                className="w-4 h-4 accent-primary-600" />
                              <div className="flex-1">
                                <p className="font-semibold text-sm">{item.productName}</p>
                                <p className="text-xs text-gray-400">Sold: {item.originalQuantity} · Returnable: {item.returnableQuantity} · {fmt(item.unitPrice)}</p>
                              </div>
                            </div>
                            {sel.selected && (
                              <div className="grid grid-cols-3 gap-2 text-sm">
                                <div>
                                  <label className="label">Qty</label>
                                  <input type="number" min={1} max={item.returnableQuantity} value={sel.quantity} className="input-sm"
                                    onChange={(e) => updateSel({ quantity: Math.min(item.returnableQuantity, Math.max(1, parseInt(e.target.value) || 1)) })} />
                                </div>
                                <div>
                                  <label className="label">Condition</label>
                                  <select className="input-sm" value={sel.condition} onChange={(e) => updateSel({ condition: e.target.value })}>
                                    <option value="resellable">Resellable</option>
                                    <option value="damaged">Damaged</option>
                                    <option value="supplier_return">Supplier Return</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="label">Reason</label>
                                  <select className="input-sm" value={sel.reason} onChange={(e) => updateSel({ reason: e.target.value })}>
                                    {RETURN_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 3: Refund */}
                  <div>
                    <p className="text-xs font-bold text-primary-600 uppercase tracking-wide mb-2">3. Refund Details</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">Refund Method</label>
                        <select className="input" value={refundMethod} onChange={(e) => setRefundMethod(e.target.value)}>
                          {REFUND_METHODS.map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="label">Refund Amount</label>
                        <input className="input bg-gray-50 font-bold" value={fmt(computedRefundTotal)} readOnly />
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="label">Notes</label>
                      <textarea className="input" rows={2} value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} />
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-outline btn-sm" onClick={() => setCreateOpen(false)}>Cancel</button>
              {saleInfo && (
                <button className="btn-primary btn-sm" onClick={handleConfirmReturn} disabled={submitting}>
                  {submitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Process Return ({fmt(computedRefundTotal)})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Return Detail */}
      {viewReturn && (
        <div className="modal-overlay" onClick={() => setViewReturn(null)}>
          <div className="modal-box max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="font-bold text-gray-900">{viewReturn.returnNumber}</h2>
                <p className="text-xs text-gray-400">{new Date(viewReturn.returnDate || viewReturn.createdAt).toLocaleString('en-IN')}</p>
              </div>
              <button className="icon-btn" onClick={() => setViewReturn(null)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="modal-body space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><p className="label">Invoice #</p><p className="font-bold font-mono">{viewReturn.originalSale?.invoiceNumber}</p></div>
                <div><p className="label">Customer</p><p className="font-bold">{viewReturn.originalSale?.customerName ?? '—'}</p></div>
                <div><p className="label">Refund Method</p><p className="font-bold uppercase">{viewReturn.refundMethod?.replace('_', ' ')}</p></div>
                <div><p className="label">Total Refund</p><p className="font-bold text-red-600">{fmt(viewReturn.totalRefund)}</p></div>
              </div>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50"><tr>
                    <th className="px-3 py-2 text-left text-gray-400 font-bold uppercase">Product</th>
                    <th className="px-3 py-2 text-right text-gray-400 font-bold uppercase">Qty</th>
                    <th className="px-3 py-2 text-right text-gray-400 font-bold uppercase">Condition</th>
                    <th className="px-3 py-2 text-right text-gray-400 font-bold uppercase">Refund</th>
                  </tr></thead>
                  <tbody>
                    {viewReturn.items.map((ri, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-3 py-2 font-semibold">{ri.product.name}</td>
                        <td className="px-3 py-2 text-right font-semibold">{ri.quantity}</td>
                        <td className="px-3 py-2 text-right"><span className={condCls[ri.condition] ?? 'badge-default'}>{condLabel[ri.condition] ?? ri.condition}</span></td>
                        <td className="px-3 py-2 text-right font-bold text-red-600">− {fmt(ri.quantity * ri.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
