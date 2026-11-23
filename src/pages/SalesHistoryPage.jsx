import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../components/common/PageHeader';
import PrintInvoice from '../components/billing/PrintInvoice';
import SaleDetailDialog from '../components/billing/SaleDetailDialog';
import { salesApi } from '../api/sales';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n);

const DATE_FILTERS = [
  { label: 'All', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'Custom', value: 'custom' },
];

function getDateRange(filter, customStart, customEnd) {
  const now = new Date();
  if (filter === 'today') return { startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString() };
  if (filter === 'week')  return { startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).toISOString() };
  if (filter === 'month') return { startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString() };
  if (filter === 'custom' && customStart) return {
    startDate: new Date(customStart).toISOString(),
    ...(customEnd && { endDate: new Date(new Date(customEnd).setHours(23, 59, 59, 999)).toISOString() }),
  };
  return {};
}

const payBadgeCls = { paid: 'badge-success', partial: 'badge-warning', unpaid: 'badge-error' };

export default function SalesHistoryPage() {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(20);
  const [viewSale, setViewSale] = useState(null);
  const [showBill, setShowBill] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchSales = useCallback(async () => {
    if (dateFilter === 'custom' && (!customStart || !customEnd)) return;
    setLoading(true);
    try {
      const range = getDateRange(dateFilter, customStart, customEnd);
      const res = await salesApi.getSales({ search: search || undefined, ...range, page: page + 1, pageSize: rowsPerPage });
      setSales(res.data);
      setTotal(res.pagination.total);
    } catch { toast.error('Failed to load sales'); }
    finally { setLoading(false); }
  }, [search, dateFilter, customStart, customEnd, page, rowsPerPage]);

  useEffect(() => { fetchSales(); }, [fetchSales]);
  useEffect(() => { const t = setTimeout(() => setPage(0), 350); return () => clearTimeout(t); }, [search]);

  const handleCancelBill = async () => {
    if (!viewSale || !cancelReason.trim()) return;
    setCancelling(true);
    try {
      const cancelled = await salesApi.cancelSale(viewSale._id, cancelReason.trim());
      setViewSale(cancelled);
      setCancelOpen(false);
      setCancelReason('');
      toast.success('Bill cancelled and stock restored');
      await fetchSales();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Could not cancel bill');
    } finally { setCancelling(false); }
  };

  const totalPages = Math.ceil(total / rowsPerPage);

  return (
    <div>
      <PageHeader title="Sales History" subtitle="View and manage all past invoices" />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 items-start sm:items-center flex-wrap">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input className="input pl-9 w-64" placeholder="Search invoice # or customer…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {DATE_FILTERS.map((f) => (
            <button key={f.value}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${dateFilter === f.value ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'}`}
              onClick={() => { setDateFilter(f.value); setPage(0); }}>
              {f.label}
            </button>
          ))}
        </div>
        {dateFilter === 'custom' && (
          <div className="flex gap-2 items-center">
            <input type="date" className="input w-36" value={customStart} onChange={(e) => { setCustomStart(e.target.value); setPage(0); }} />
            <span className="text-gray-400 text-sm">to</span>
            <input type="date" className="input w-36" value={customEnd} onChange={(e) => { setCustomEnd(e.target.value); setPage(0); }} />
          </div>
        )}
        {!loading && <span className="text-sm text-gray-400 ml-auto">{total} invoice{total !== 1 ? 's' : ''}</span>}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th><th>Customer</th><th className="text-center">Items</th>
                <th className="text-right">Total</th><th className="text-right">Paid</th>
                <th className="text-center">Status</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-10">
                  <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : sales.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">
                  {search ? 'No invoices match your search' : 'No sales yet'}
                </td></tr>
              ) : sales.map((s) => (
                <tr key={s._id} onClick={() => setViewSale(s)}>
                  <td><span className="font-mono font-bold text-xs text-primary-600">{s.invoiceNumber}</span></td>
                  <td><span className="font-semibold text-sm">{s.customerName}</span></td>
                  <td className="text-center"><span className="badge-default">{s.items.length}</span></td>
                  <td className="text-right font-bold text-sm">{fmt(s.grandTotal)}</td>
                  <td className="text-right text-green-600 font-semibold text-sm">{fmt(s.paidAmount)}</td>
                  <td className="text-center">
                    {s.status === 'cancelled'
                      ? <span className="badge-error">Cancelled</span>
                      : <span className={payBadgeCls[s.paymentStatus] ?? 'badge-default'}>{s.paymentStatus}</span>}
                  </td>
                  <td>
                    <p className="text-sm font-semibold">{new Date(s.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    <p className="text-xs text-gray-400">{new Date(s.invoiceDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <span>{total} total</span>
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

      {/* Cancel Dialog */}
      {cancelOpen && (
        <div className="modal-overlay" onClick={() => { if (!cancelling) { setCancelOpen(false); setCancelReason(''); } }}>
          <div className="modal-box max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <div>
                  <p className="font-bold text-gray-800">Cancel this bill?</p>
                  <p className="text-xs text-gray-400">This will restore stock.</p>
                </div>
              </div>
            </div>
            <div className="modal-body space-y-3">
              <div className="bg-gray-50 rounded-lg p-3 flex justify-between items-center text-sm">
                <div><p className="text-xs text-gray-400">INVOICE</p><p className="font-bold">{viewSale?.invoiceNumber}</p></div>
                <p className="font-bold">{viewSale ? fmt(viewSale.grandTotal) : ''}</p>
              </div>
              <p className="text-sm text-gray-500">Cancelling returns sold quantities to inventory and marks the invoice as cancelled.</p>
              <div>
                <label className="label">Reason for cancellation *</label>
                <input className={`input ${cancelReason.trim() === '' ? 'input-error' : ''}`}
                  placeholder="e.g. Customer requested cancellation"
                  value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} disabled={cancelling} />
                {cancelReason.trim() === '' && <p className="error-msg">Reason is required</p>}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline btn-sm" disabled={cancelling} onClick={() => { setCancelOpen(false); setCancelReason(''); }}>Keep Bill</button>
              <button className="btn-danger btn-sm" disabled={cancelling || !cancelReason.trim()} onClick={handleCancelBill}>
                {cancelling && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Cancel Bill
              </button>
            </div>
          </div>
        </div>
      )}

      <SaleDetailDialog
        open={!!viewSale} sale={viewSale}
        onClose={() => setViewSale(null)}
        onShowBill={() => setShowBill(true)}
        onReturn={() => { if (!viewSale) return; const inv = viewSale.invoiceNumber; setViewSale(null); navigate(`/returns?invoiceId=${inv}`); }}
        onCancel={() => setCancelOpen(true)}
      />

      <PrintInvoice open={showBill} sale={viewSale} onClose={() => setShowBill(false)} />
    </div>
  );
}
