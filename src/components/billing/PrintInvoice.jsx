import React, { useRef } from 'react';
import html2canvas from 'html2canvas';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n);

export default function PrintInvoice({ open, sale, onClose, onReturn, onCancel }) {
  const printAreaRef = useRef(null);

  if (!open || !sale) return null;

  const shopName        = import.meta.env.VITE_SHOP_NAME || import.meta.env.VITE_APP_NAME || 'My Shop';
  const shopAddress     = import.meta.env.VITE_SHOP_ADDRESS;
  const shopPhone       = import.meta.env.VITE_SHOP_PHONE;
  const shopWorkingDays = import.meta.env.VITE_SHOP_WORKING_DAYS;
  const shopWorkingHours= import.meta.env.VITE_SHOP_WORKING_HOURS;

  const handlePrintPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) { window.alert('Allow pop-ups for this site to print the receipt.'); return; }
    import('../../utils/receiptPdf')
      .then(({ printReceiptPdf }) =>
        printReceiptPdf(sale, shopName, shopAddress, shopPhone, shopWorkingDays, shopWorkingHours, printWindow)
      )
      .catch((error) => {
        console.error('Receipt printing failed:', error);
        printWindow.close();
        window.alert(`Could not prepare the receipt.${error instanceof Error ? '\n' + error.message : ''}`);
      });
  };

  const handlePrintImage = async () => {
    const el = printAreaRef.current;
    if (!el) return;
    try {
      const canvas = await html2canvas(el, { scale: 3, useCORS: true, backgroundColor: '#ffffff', logging: false });
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${sale.invoiceNumber}.png`;
      link.click();
    } catch (err) {
      console.error('Image download failed:', err);
      window.alert('Could not download receipt as image.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl overflow-visible relative"
        style={{ width: '80mm', maxWidth: 'calc(100vw - 40px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toolbar */}
        <div className="receipt-toolbar flex items-center justify-end gap-2 p-3 flex-wrap">
          <button className="btn-primary btn-sm" onClick={handlePrintPdf}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
            </svg>
            Print PDF
          </button>
          <button className="btn-outline btn-sm" onClick={handlePrintImage}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            Image
          </button>
          {onReturn && sale.status === 'confirmed' && (
            <button className="btn-outline btn-sm" onClick={onReturn}>Return</button>
          )}
          {onCancel && sale.status === 'confirmed' && (
            <button className="btn-danger-outline btn-sm" onClick={onCancel}>Cancel</button>
          )}
        </div>

        {/* Receipt */}
        <div ref={printAreaRef} id="invoice-print-area" className="thermal-receipt">
          {sale.status === 'cancelled' && (
            <div style={{ color: '#c62828', textAlign: 'center', fontWeight: 700, marginBottom: 8 }}>
              CANCELLED BILL
            </div>
          )}
          <header className="receipt-header">
            <h1>{shopName}</h1>
            {shopAddress && shopAddress.split('\\n').map((line, i) => <div key={i}>{line}</div>)}
            {shopPhone && <div>Tel: {shopPhone}</div>}
          </header>

          <div className="receipt-rule" />
          <section className="receipt-meta">
            <div><strong>Bill No:</strong> {sale.invoiceNumber}</div>
            <div><strong>Date:</strong> {new Date(sale.invoiceDate).toLocaleString('en-IN', {
              day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}</div>
            <div><strong>Customer:</strong> {sale.customerName || 'Walk-in Customer'}</div>
            <div><strong>Payment:</strong> {sale.paymentMethod.replace('_', ' ').toUpperCase()}</div>
          </section>

          <div className="receipt-rule" />
          <table className="receipt-items">
            <thead>
              <tr><th>Item</th><th>Qty</th><th className="receipt-money">Amount</th></tr>
            </thead>
            {sale.items.map((item, i) => (
              <tbody key={i} className="receipt-item">
                <tr><td colSpan={3} className="receipt-product">{item.productName}</td></tr>
                <tr className="receipt-item-detail">
                  <td>{item.sku} · {item.unit}</td>
                  <td>{item.quantity}</td>
                  <td className="receipt-money">{fmt(item.lineTotal)}</td>
                </tr>
                <tr className="receipt-item-detail receipt-rate">
                  <td colSpan={2}>{item.quantity} × {fmt(item.unitPrice)}{item.discountAmount > 0 ? ` · Disc ${fmt(item.discountAmount)}` : ''}</td>
                  <td />
                </tr>
              </tbody>
            ))}
          </table>

          <div className="receipt-rule" />
          <section className="receipt-totals">
            <div><span>Subtotal</span><strong>{fmt(sale.subtotal)}</strong></div>
            {sale.discountTotal > 0 && <div><span>Discount</span><strong>- {fmt(sale.discountTotal)}</strong></div>}
            <div className="receipt-grand-total"><span>Grand Total</span><strong>{fmt(sale.grandTotal)}</strong></div>
            <div><span>Amount Paid</span><strong>{fmt(sale.paidAmount)}</strong></div>
            {sale.balanceDue > 0 && <div><span>Balance Due</span><strong>{fmt(sale.balanceDue)}</strong></div>}
          </section>

          {sale.notes && <div className="receipt-notes"><strong>Note:</strong> {sale.notes}</div>}
          {(shopWorkingDays || shopWorkingHours) && (
            <div className="receipt-hours">
              <div><strong>WORKING TIME</strong></div>
              {shopWorkingDays && <div>{shopWorkingDays}</div>}
              {shopWorkingHours && <div>{shopWorkingHours}</div>}
            </div>
          )}
          <footer className="receipt-footer">Thank You for Shopping!</footer>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-gray-200 border border-gray-400 text-gray-700 hover:bg-gray-300 flex items-center justify-center"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
