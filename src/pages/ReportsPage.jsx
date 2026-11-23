import React, { useState, useEffect, useCallback } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import PageHeader from '../components/common/PageHeader';
import { reportsApi } from '../api/reports';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const fmtDec = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n);
const fmtShort = (n) => { if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`; if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`; return `₹${n.toFixed(0)}`; };

const PIE_COLORS = ['#1a3a5c', '#e67e22', '#27ae60', '#2980b9', '#8e44ad', '#c0392b'];

const PERIODS = [
  { label: 'Today', value: 'today' }, { label: 'Yesterday', value: 'yesterday' },
  { label: 'This Week', value: 'this_week' }, { label: 'Last Week', value: 'last_week' },
  { label: 'This Month', value: 'this_month' }, { label: 'Last Month', value: 'last_month' },
  { label: 'This Year', value: 'this_year' }, { label: 'Custom', value: 'custom' },
];

const TABS = ['Overview', 'Sales Trend', 'Products', 'Stock'];

function StatCard({ title, value, sub, color, growth, loading }) {
  return (
    <div className={`card p-4 border-l-4`} style={{ borderLeftColor: color }}>
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      {loading ? <div className="w-24 h-7 bg-gray-100 animate-pulse rounded" /> : <p className="text-xl font-bold text-gray-900">{value}</p>}
      {sub && !loading && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      {growth != null && !loading && (
        <div className={`flex items-center gap-1 mt-1 text-xs font-semibold ${growth > 0 ? 'text-green-600' : growth < 0 ? 'text-red-600' : 'text-gray-400'}`}>
          {growth > 0 ? '↑' : growth < 0 ? '↓' : '→'} {growth > 0 ? '+' : ''}{growth}% vs prev period
        </div>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="card p-4">
      <p className="font-bold text-gray-800 mb-4">{title}</p>
      {children}
    </div>
  );
}

export default function ReportsPage() {
  const [period, setPeriod] = useState('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tab, setTab] = useState(0);
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [payBreakdown, setPayBreakdown] = useState([]);
  const [stockVal, setStockVal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stockLoading, setStockLoading] = useState(false);

  const load = useCallback(async () => {
    if (period === 'custom' && (!startDate || !endDate)) return;
    setLoading(true);
    try {
      const sd = period === 'custom' ? startDate : undefined;
      const ed = period === 'custom' ? endDate : undefined;
      const [s, t, tp, pb] = await Promise.all([
        reportsApi.getSummary(period, sd, ed), reportsApi.getTrend(period, sd, ed),
        reportsApi.getTopProducts(period, sd, ed), reportsApi.getPaymentBreakdown(period, sd, ed),
      ]);
      setSummary(s); setTrend(t); setTopProducts(tp); setPayBreakdown(pb);
    } catch { /* per-section */ }
    finally { setLoading(false); }
  }, [period, startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (tab === 3 && !stockVal) {
      setStockLoading(true);
      reportsApi.getStockValuation().then(setStockVal).finally(() => setStockLoading(false));
    }
  }, [tab, stockVal]);

  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Business performance at a glance" />

      {/* Period selector */}
      <div className="card p-4 mb-5 flex flex-wrap gap-3 items-center">
        <select className="input w-44" value={period} onChange={(e) => setPeriod(e.target.value)}>
          {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        {period === 'custom' && (
          <>
            <input type="date" className="input w-40" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <input type="date" className="input w-40" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </>
        )}
        {loading && <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />}
        {summary && (
          <span className="text-xs text-gray-400">
            {new Date(summary.period.start).toLocaleDateString('en-IN')} → {new Date(summary.period.end).toLocaleDateString('en-IN')}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        {TABS.map((t, i) => (
          <button key={t}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${tab === i ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setTab(i)}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 0 && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Revenue" value={summary ? fmt(summary.revenue) : '—'} sub={`${summary?.orders ?? 0} orders`} color="#1a3a5c" growth={summary?.revenueGrowth ?? null} loading={loading} />
            <StatCard title="Gross Profit" value={summary ? fmt(summary.grossProfit) : '—'} sub={summary ? `Margin: ${summary.grossMargin}%` : ''} color="#27ae60" loading={loading} />
            <StatCard title="Cost of Goods" value={summary ? fmt(summary.cogs) : '—'} sub="Total purchase cost" color="#f39c12" loading={loading} />
            <StatCard title="Avg Order Value" value={summary ? fmt(summary.avgOrderValue) : '—'} sub={`${summary?.itemsSold ?? 0} items sold`} color="#2980b9" loading={loading} />
          </div>

          <Section title="Profit & Loss Summary">
            {loading ? <div className="flex justify-center py-6"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
              : summary ? (
                <div>
                  <div className="divide-y divide-gray-100">
                    {[
                      { label: 'Gross Revenue', value: summary.revenue, bold: false, color: '' },
                      { label: '(-) Discounts', value: -summary.discount, bold: false, color: 'text-red-600' },
                      { label: 'Net Revenue', value: summary.revenue - summary.discount, bold: true, color: '' },
                      { label: '(-) Cost of Goods', value: -summary.cogs, bold: false, color: 'text-red-600' },
                      { label: 'Gross Profit', value: summary.grossProfit, bold: true, color: summary.grossProfit >= 0 ? 'text-green-600' : 'text-red-600' },
                    ].map((row) => (
                      <div key={row.label} className={`flex justify-between py-2.5 px-2 text-sm ${row.bold ? 'font-bold' : ''}`}>
                        <span className="text-gray-700">{row.label}</span>
                        <span className={row.color || 'text-gray-900'}>{row.value < 0 ? `- ${fmt(Math.abs(row.value))}` : fmt(row.value)}</span>
                      </div>
                    ))}
                  </div>
                  <div className={`mt-3 p-3 rounded-xl flex justify-between items-center font-bold ${summary.grossProfit >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    <span>Gross Profit Margin</span><span>{summary.grossMargin}%</span>
                  </div>
                </div>
              ) : <p className="text-center text-gray-400 py-4">No data for selected period</p>
            }
          </Section>

          <Section title="Payment Method Breakdown">
            {loading ? <div className="flex justify-center py-6"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
              : payBreakdown.length === 0 ? <p className="text-center text-gray-400 py-6">No payment data</p>
              : (
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="w-full md:w-64 h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={payBreakdown} dataKey="total" nameKey="method" cx="50%" cy="50%" outerRadius={80}
                          label={({ method, percent }) => `${method.replace('_', ' ')} ${(percent * 100).toFixed(0)}%`}>
                          {payBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v) => fmt(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-3">
                    {payBreakdown.map((p, i) => (
                      <div key={p.method} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="text-sm capitalize">{p.method.replace('_', ' ')}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{fmt(p.total)}</p>
                          <p className="text-xs text-gray-400">{p.count} orders</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }
          </Section>
        </div>
      )}

      {/* Sales Trend */}
      {tab === 1 && (
        <div className="space-y-5">
          <Section title="Revenue & Profit Trend">
            {loading ? <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
              : trend.length === 0 ? <p className="text-center text-gray-400 py-8">No data for selected period</p>
              : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trend} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1a3a5c" stopOpacity={0.2} /><stop offset="95%" stopColor="#1a3a5c" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorPro" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#27ae60" stopOpacity={0.2} /><stop offset="95%" stopColor="#27ae60" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={fmtShort} />
                    <Tooltip formatter={(v, name) => [fmtDec(v), name === 'revenue' ? 'Revenue' : 'Profit']} labelFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} />
                    <Legend formatter={(v) => v === 'revenue' ? 'Revenue' : 'Gross Profit'} />
                    <Area type="monotone" dataKey="revenue" stroke="#1a3a5c" strokeWidth={2} fill="url(#colorRev)" />
                    <Area type="monotone" dataKey="profit" stroke="#27ae60" strokeWidth={2} fill="url(#colorPro)" />
                  </AreaChart>
                </ResponsiveContainer>
              )
            }
          </Section>
          <Section title="Daily Orders">
            {loading ? <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
              : trend.length === 0 ? <p className="text-center text-gray-400 py-6">No data</p>
              : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={trend} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip labelFormatter={(d) => new Date(d).toLocaleDateString('en-IN')} />
                    <Bar dataKey="orders" fill="#e67e22" radius={[4, 4, 0, 0]} name="Orders" />
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </Section>
        </div>
      )}

      {/* Products */}
      {tab === 2 && (
        <Section title="Top Products by Revenue">
          {loading ? <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
            : topProducts.length === 0 ? <p className="text-center text-gray-400 py-8">No sales data for selected period</p>
            : (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={topProducts.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={fmtShort} />
                    <YAxis type="category" dataKey="productName" tick={{ fontSize: 11 }} width={130} tickFormatter={(v) => v.length > 18 ? v.slice(0, 18) + '…' : v} />
                    <Tooltip formatter={(v, name) => [fmtDec(v), name === 'revenue' ? 'Revenue' : 'Profit']} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#1a3a5c" radius={[0, 4, 4, 0]} name="Revenue" />
                    <Bar dataKey="profit" fill="#27ae60" radius={[0, 4, 4, 0]} name="Profit" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="overflow-x-auto mt-4 rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr>
                      {['#', 'Product', 'SKU', 'Qty', 'Revenue', 'COGS', 'Profit', 'Margin'].map((h) => (
                        <th key={h} className={`px-3 py-2 text-xs font-bold uppercase text-gray-400 ${h === 'Product' || h === 'SKU' ? 'text-left' : 'text-right'}`}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {topProducts.map((p, i) => (
                        <tr key={p.productId} className="border-t border-gray-100">
                          <td className="px-3 py-2 text-center text-gray-400">{i + 1}</td>
                          <td className="px-3 py-2 font-semibold">{p.productName}</td>
                          <td className="px-3 py-2 text-gray-400 font-mono">{p.sku}</td>
                          <td className="px-3 py-2 text-right">{p.qtySold}</td>
                          <td className="px-3 py-2 text-right">{fmtDec(p.revenue)}</td>
                          <td className="px-3 py-2 text-right text-red-500">{fmtDec(p.cogs)}</td>
                          <td className={`px-3 py-2 text-right font-semibold ${p.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmtDec(p.profit)}</td>
                          <td className="px-3 py-2 text-right">
                            <span className={p.margin >= 30 ? 'badge-success' : p.margin >= 10 ? 'badge-warning' : 'badge-error'}>{p.margin}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )
          }
        </Section>
      )}

      {/* Stock */}
      {tab === 3 && (
        <div className="space-y-5">
          {stockLoading ? <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
            : stockVal ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatCard title="Stock at Cost" value={fmt(stockVal.totalCostValue)} sub={`${stockVal.items.length} products`} color="#1a3a5c" />
                  <StatCard title="Stock at Sell Price" value={fmt(stockVal.totalSaleValue)} sub="If all stock sold" color="#2980b9" />
                  <StatCard title="Potential Profit" value={fmt(stockVal.potentialProfit)} sub="Sale value minus cost" color="#27ae60" />
                </div>
                {stockVal.items.filter((i) => i.isLowStock).length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl px-4 py-3 text-sm font-semibold">
                    ⚠ {stockVal.items.filter((i) => i.isLowStock).length} product(s) are at or below minimum stock threshold.
                  </div>
                )}
                <Section title="Stock Valuation — All Products">
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50"><tr>
                        {['Product', 'SKU', 'Stock', 'Cost Price', 'Sell Price', 'Cost Value', 'Sale Value', 'Status'].map((h) => (
                          <th key={h} className={`px-3 py-2 text-xs font-bold uppercase text-gray-400 ${['Product', 'SKU'].includes(h) ? 'text-left' : 'text-right'}`}>{h}</th>
                        ))}
                      </tr></thead>
                      <tbody>
                        {stockVal.items.map((item) => (
                          <tr key={item.sku} className="border-t border-gray-100">
                            <td className="px-3 py-2 font-semibold">{item.name}</td>
                            <td className="px-3 py-2 font-mono text-gray-400">{item.sku}</td>
                            <td className={`px-3 py-2 text-right font-bold ${item.currentStock <= 0 ? 'text-red-600' : item.isLowStock ? 'text-yellow-600' : 'text-gray-800'}`}>{item.currentStock}</td>
                            <td className="px-3 py-2 text-right">{fmtDec(item.purchaseCost)}</td>
                            <td className="px-3 py-2 text-right">{fmtDec(item.sellingPrice)}</td>
                            <td className="px-3 py-2 text-right">{fmtDec(item.costValue)}</td>
                            <td className="px-3 py-2 text-right font-semibold">{fmtDec(item.saleValue)}</td>
                            <td className="px-3 py-2 text-right">
                              {item.currentStock <= 0 ? <span className="badge-error">Out of Stock</span>
                                : item.isLowStock ? <span className="badge-warning">Low Stock</span>
                                : <span className="badge-success">In Stock</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                        <tr>
                          <td colSpan={5} className="px-3 py-2.5 font-bold">Total</td>
                          <td className="px-3 py-2.5 text-right font-bold">{fmt(stockVal.totalCostValue)}</td>
                          <td className="px-3 py-2.5 text-right font-bold">{fmt(stockVal.totalSaleValue)}</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </Section>
              </>
            ) : <p className="text-center text-gray-400 py-8">Failed to load stock data</p>
          }
        </div>
      )}
    </div>
  );
}
