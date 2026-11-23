import React, { useState, useEffect } from 'react';
import { returnsApi } from '../../api/returns';
import PrintInvoice from './PrintInvoice';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n);

const statusCls = {
  confirmed: 'badge-success', cancelled: 'badge-error', returned: 'badge-warning', draft: 'badge-default',
};
const payStatusCls = {
  paid: 'badge-success', partial: 'badge-warning', unpaid: 'badge-error',
};

function InfoBlock({ label, value, mono }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`text-sm font-bold mt-0.5 text-gray-800 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}

export default function SaleDetailDialog({ open, sale, onClose, onReturn, onCancel, onShowBill }) {
  const [returns, setReturns] = useState([]);
  const [returnsLoading, setReturnsLoading] = useState(false);
  const [showAdjustedBill, setShowAdjustedBill] = useState(false);

  useEffect(() => {
    if (!open || !sale) { setReturns([]); return; }
    setReturnsLoading(true);
    returnsApi.getReturns({ search: sale.invoiceNumber, pageSize: 50 })
      .then((res) => setReturns(res.data))
      .catch(() => setReturns([]))
      .finally(() => setReturnsLoading(false));
  }, [open, sale?._id]);

  if (!open || !sale) return null;
  const isConfirmed = sale.status === 'confirmed';
  const hasReturns = returns.length > 0;

  // Build adjusted sale
  const adjustedSale = hasReturns ? (() => {
    const returnedQtyBySku = {};
    for (const ret of returns) {
      if (ret.status === 'rejected') continue;
      for (const ri of ret.items) {
        const sku = ri.product.sku;
        returnedQtyBySku[sku] = (returnedQtyBySku[sku] ?? 0) + ri.quantity;
      }
    }
    const adjustedItems = sale.items
      .map((item) => {
        const returnedQty = returnedQtyBySku[item.sku] ?? 0;
        const remainingQty = item.quantity - returnedQty;
        if (remainingQty <= 0) return null;
        const ratio = remainingQty / item.quantity;
        return {
          ...item,
          quantity: remainingQty,
          discountAmount: parseFloat((item.discountAmount * ratio).toFixed(2)),
          lineTotal: parseFloat((item.lineTotal * ratio).toFixed(2)),
        };
      })
      .filter(Boolean);
    const grandTotal = parseFloat(adjustedItems.reduce((s, i) => s + i.lineTotal, 0).toFixed(2));
    return {
      ...sale,
      items: adjustedItems,
      grandTotal,
      paidAmount: grandTotal,
      balanceDue: 0,
      notes: `Adjusted bill (excl. returned items). Original: ${sale.invoiceNumber}`,
    };
  })() : null;

  const conditionLabel = { resellable: 'Resellable (Restocked)', damaged: 'Damaged', supplier_return: 'Supplier Return' };
  const conditionCls   = { resellable: 'badge-success', damaged: 'badge-error', supplier_return: 'badge-warning' };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-box max-w-3xl" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="modal-header">
            <div>
              <h2 className="text-base font-bold text-gray-900">Invoice — {sale.invoiceNumber}</h2>
              <p className="text-xs text-gray-400">
                {new Date(sale.invoiceDate).toLocaleString('en-IN', {
                  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
                })}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {onShowBill && (
                <button className="btn-outline-primary btn-sm" onClick={onShowBill}>Show Bill</button>
              )}
              {hasReturns && adjustedSale && (
                <button className="btn btn-sm border border-yellow-400 text-yellow-700 bg-white hover:bg-yellow-50" onClick={() => setShowAdjustedBill(true)}>
                  Adjusted Bill
                </button>
              )}
              {onReturn && isConfirmed && (
                <button className="btn-outline btn-sm" onClick={onReturn}>Return Items</button>
              )}
              {onCancel && isConfirmed && (
                <button className="btn-danger-outline btn-sm" onClick={onCancel}>Cancel Bill</button>
              )}
              <button className="icon-btn" onClick={onClose} aria-label="Close">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          <div className="modal-body">
            {sale.status === 'cancelled' && (
              <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-semibold flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                This bill has been cancelled.
              </div>
            )}

            {/* Info grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
              <InfoBlock label="Invoice #" value={sale.invoiceNumber} mono />
              <InfoBlock label="Date" value={new Date(sale.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} />
              <InfoBlock label="Customer" value={sale.customerName || 'Walk-in Customer'} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Status</p>
                <span className={`${statusCls[sale.status] ?? 'badge-default'} mt-1 inline-block`}>
                  {sale.status}
                </span>
              </div>
            </div>

            <hr className="mb-4" />

            {/* Items table */}
            <h3 className="text-sm font-bold text-gray-700 mb-2">Items Sold</h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200 mb-5">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Product', 'SKU', 'Qty', 'Unit Price', 'Discount', 'Line Total'].map((h, i) => (
                      <th key={h} className={`px-4 py-2 text-xs font-bold uppercase text-gray-400 ${i >= 2 ? 'text-right' : i === 1 ? 'text-center' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((item, i) => (
                    <tr key={i} className={`border-t border-gray-100 ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                      <td className="px-4 py-2.5">
                        <p className="font-semibold text-gray-800">{item.productName}</p>
                        <p className="text-xs text-gray-400">{item.unit}</p>
                      </td>
                      <td className="px-4 py-2.5 text-center font-mono text-xs text-gray-500">{item.sku}</td>
                      <td className="px-4 py-2.5 text-right font-semibold">{item.quantity}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600">{fmt(item.unitPrice)}</td>
                      <td className="px-4 py-2.5 text-right">
                        {item.discountAmount > 0
                          ? <span className="text-green-600 font-semibold">− {fmt(item.discountAmount)}</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right font-bold text-primary-600">{fmt(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Payment + Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="border border-gray-200 rounded-xl p-4">
                <p className="text-xs font-bold uppercase text-gray-400 mb-3">Payment Details</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Method</span><span className="font-bold uppercase">{sale.paymentMethod.replace('_', ' ')}</span></div>
                  <div className="flex justify-between items-center"><span className="text-gray-500">Status</span><span className={payStatusCls[sale.paymentStatus] ?? 'badge-default'}>{sale.paymentStatus}</span></div>
                  {sale.notes && <div className="pt-2 border-t border-gray-100"><p className="text-xs font-semibold text-gray-400">Notes</p><p className="text-sm mt-0.5">{sale.notes}</p></div>}
                </div>
              </div>
              <div className="border border-gray-200 rounded-xl p-4">
                <p className="text-xs font-bold uppercase text-gray-400 mb-3">Summary</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-semibold">{fmt(sale.subtotal)}</span></div>
                  {sale.discountTotal > 0 && (
                    <div className="flex justify-between"><span className="text-gray-500">Discount</span><span className="font-semibold text-green-600">− {fmt(sale.discountTotal)}</span></div>
                  )}
                  <hr />
                  <div className="flex justify-between"><span className="font-bold">Grand Total</span><span className="font-extrabold text-primary-600">{fmt(sale.grandTotal)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Paid</span><span className="font-semibold text-green-600">{fmt(sale.paidAmount)}</span></div>
                  {sale.balanceDue > 0 && (
                    <div className="flex justify-between"><span className="text-gray-500">Balance Due</span><span className="font-bold text-red-600">{fmt(sale.balanceDue)}</span></div>
                  )}
                </div>
              </div>
            </div>

            {/* Returns history */}
            {returnsLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span className="w-4 h-4 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin" />
                Loading return history…
              </div>
            )}
            {!returnsLoading && returns.length > 0 && (
              <>
                <hr className="my-4" />
                <h3 className="text-sm font-bold text-gray-700 mb-3">Return History ({returns.length})</h3>
                <div className="space-y-3">
                  {returns.map((ret) => (
                    <div key={ret._id} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm">{ret.returnNumber}</span>
                          <span className={statusCls[ret.status] ?? 'badge-default'}>{ret.status}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-400">{new Date(ret.returnDate).toLocaleDateString('en-IN')}</span>
                          <span className="font-bold text-red-600">− {fmt(ret.totalRefund)}</span>
                        </div>
                      </div>
                      <table className="w-full text-xs">
                        <thead className="bg-white">
                          <tr>
                            {['Product', 'Qty', 'Price', 'Condition', 'Reason', 'Refund'].map((h, i) => (
                              <th key={h} className={`px-3 py-2 text-gray-400 font-bold uppercase ${i > 0 ? 'text-right' : 'text-left'}`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {ret.items.map((ri, j) => (
                            <tr key={j} className="border-t border-gray-100">
                              <td className="px-3 py-2 font-semibold">{ri.product.name}<br/><span className="font-mono text-gray-400">{ri.product.sku}</span></td>
                              <td className="px-3 py-2 text-right font-semibold">{ri.quantity}</td>
                              <td className="px-3 py-2 text-right">{fmt(ri.unitPrice)}</td>
                              <td className="px-3 py-2 text-right"><span className={conditionCls[ri.condition] ?? 'badge-default'}>{conditionLabel[ri.condition] ?? ri.condition}</span></td>
                              <td className="px-3 py-2 text-right text-gray-500">{ri.returnReason || '—'}</td>
                              <td className="px-3 py-2 text-right font-bold text-red-600">− {fmt(ri.quantity * ri.unitPrice)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex justify-between items-center text-xs">
                        <span className="text-gray-500">Refund: <strong className="uppercase">{ret.refundMethod?.replace('_', ' ')}</strong> · Status: <strong>{ret.refundStatus}</strong></span>
                        <span className="font-bold text-red-600">Total: {fmt(ret.totalRefund)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <PrintInvoice open={showAdjustedBill} sale={adjustedSale} onClose={() => setShowAdjustedBill(false)} />
    </>
  );
}
