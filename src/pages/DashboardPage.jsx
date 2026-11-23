import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { salesApi } from '../api/sales';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);

function StatCard({ title, value, subtitle, icon, colorCls, bgCls, loading, trend }) {
  return (
    <div className={`card p-5 relative overflow-hidden h-full`}>
      <div className={`absolute top-0 left-0 right-0 h-1 ${colorCls}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1">{title}</p>
          {loading
            ? <div className="w-20 h-7 bg-gray-100 animate-pulse rounded" />
            : <p className="text-2xl font-extrabold text-gray-900 leading-none">{value}</p>}
          <div className="flex items-center gap-1 mt-1.5">
            {trend && !loading && (
              trend === 'up'
                ? <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                : <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
            )}
            <p className="text-xs text-gray-400">{subtitle}</p>
          </div>
        </div>
        <div className={`w-12 h-12 rounded-xl ${bgCls} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

const payBadgeCls = { paid: 'badge-success', partial: 'badge-warning', unpaid: 'badge-error' };

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    salesApi.getDashboardStats()
      .then(({ stats: s, recentSales: r }) => { setStats(s); setRecentSales(r); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button className="btn-primary btn-sm" onClick={() => navigate('/sales')}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12h6m-3-3v6"/></svg>
            New Bill
          </button>
          <button className="btn-outline btn-sm" onClick={() => navigate('/products')}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Product
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Today's Sales" value={stats?.todaySales ?? 0} subtitle="transactions today"
          icon={<svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>}
          colorCls="bg-primary-600" bgCls="bg-primary-50"
          loading={loading} trend={stats?.todaySales > 0 ? 'up' : null}
        />
        <StatCard
          title="Today's Revenue" value={stats ? fmt(stats.todayRevenue) : '—'} subtitle="collected today"
          icon={<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
          colorCls="bg-green-500" bgCls="bg-green-50"
          loading={loading} trend={stats?.todayRevenue > 0 ? 'up' : null}
        />
        <StatCard
          title="Total Products" value={stats?.totalProducts ?? 0} subtitle="active in catalog"
          icon={<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>}
          colorCls="bg-blue-500" bgCls="bg-blue-50"
          loading={loading}
        />
        <StatCard
          title="Low Stock Alerts" value={stats?.lowStockCount ?? 0} subtitle="need restocking"
          icon={<svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
          colorCls={stats?.lowStockCount ? 'bg-orange-500' : 'bg-green-500'}
          bgCls={stats?.lowStockCount ? 'bg-orange-50' : 'bg-green-50'}
          loading={loading} trend={stats?.lowStockCount ? 'down' : null}
        />
      </div>

      {/* Recent Sales */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 bg-primary-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 12h6m-3-3v6"/></svg>
            <span className="text-white font-bold text-sm">Recent Sales</span>
            {!loading && recentSales.length > 0 && (
              <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">{recentSales.length}</span>
            )}
          </div>
          <button className="text-white/80 hover:text-white text-xs font-semibold flex items-center gap-1" onClick={() => navigate('/sales/history')}>
            View All
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : recentSales.length === 0 ? (
          <div className="py-12 text-center">
            <svg className="w-12 h-12 text-gray-200 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            <p className="font-semibold text-gray-500">No sales yet</p>
            <p className="text-sm text-gray-400 mb-3">Create your first bill to get started</p>
            <button className="btn-primary btn-sm" onClick={() => navigate('/sales')}>Create New Bill</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  {['Invoice #', 'Customer', 'Total', 'Status', 'Date'].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale) => (
                  <tr key={sale._id} onClick={() => navigate('/sales/history')}>
                    <td><span className="font-mono font-bold text-primary-600 text-xs">{sale.invoiceNumber}</span></td>
                    <td><span className="font-semibold text-sm">{sale.customerName}</span></td>
                    <td><span className="font-bold text-sm">{fmt(sale.grandTotal)}</span></td>
                    <td><span className={`${payBadgeCls[sale.paymentStatus] ?? 'badge-default'}`}>{sale.paymentStatus}</span></td>
                    <td className="text-right">
                      <span className="text-xs text-gray-500">
                        {new Date(sale.invoiceDate).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && recentSales.length > 0 && (
          <div className="px-5 py-2.5 border-t border-gray-100 bg-gray-50/50">
            <button className="text-sm font-semibold text-primary-600 hover:underline flex items-center gap-1" onClick={() => navigate('/sales/history')}>
              View full sales history
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
