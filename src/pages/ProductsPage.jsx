import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import PageHeader from '../components/common/PageHeader';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { productsApi } from '../api/products';
import { categoriesApi } from '../api/categories';

const UNITS = ['piece', 'pair', 'box', 'kg', 'meter', 'liter', 'set', 'roll'];

const schema = z.object({
  name: z.string().min(1, 'Required'),
  sku: z.string().min(1, 'Required'),
  category: z.string().optional(),
  brand: z.string().optional(),
  unit: z.enum(UNITS),
  purchaseCost: z.coerce.number().min(1, 'Required'),
  sellingPrice: z.coerce.number().min(1, 'Required'),
  currentStock: z.coerce.number().min(0).optional(),
  minStockThreshold: z.coerce.number().min(1, 'Required'),
  color: z.string().optional(),
  description: z.string().optional(),
});

const fmtCur = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);

function generateSKU(name) {
  const p = name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'PRD';
  return `${p}${Math.floor(1000 + Math.random() * 9000)}`;
}

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Low Stock', value: 'low_stock' },
  { label: 'Out of Stock', value: 'out_of_stock' },
];

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(20);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { unit: 'piece', minStockThreshold: 10 },
  });
  const nameValue = watch('name');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productsApi.getProducts({
        search: search || undefined, status: statusFilter || undefined,
        page: page + 1, pageSize: rowsPerPage,
      });
      setProducts(res.data);
      setTotal(res.pagination.total);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, [search, statusFilter, page, rowsPerPage]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { categoriesApi.getAll().then((c) => setCategoryOptions(c.map((x) => x.name))).catch(() => {}); }, []);
  useEffect(() => { const t = setTimeout(() => setPage(0), 350); return () => clearTimeout(t); }, [search]);

  const openAdd = () => { setEditProduct(null); reset({ unit: 'piece', minStockThreshold: 10 }); setDialogOpen(true); };
  const openEdit = (p) => {
    setEditProduct(p);
    reset({ name: p.name, sku: p.sku, category: p.category ?? '', brand: p.brand ?? '', unit: p.unit, purchaseCost: p.purchaseCost, sellingPrice: p.sellingPrice, currentStock: p.currentStock, minStockThreshold: p.minStockThreshold, color: p.color ?? '', description: p.description ?? '' });
    setDialogOpen(true);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (editProduct) {
        await productsApi.updateProduct(editProduct._id, data);
        toast.success('Product updated');
      } else {
        await productsApi.createProduct({ ...data, currentStock: data.currentStock ?? 0 });
        toast.success('Product created');
      }
      setDialogOpen(false);
      fetchProducts();
    } catch (err) { toast.error(err?.response?.data?.message ?? 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await productsApi.deleteProduct(deleteTarget._id);
      toast.success('Product deleted');
      setDeleteTarget(null);
      fetchProducts();
    } catch (err) { toast.error(err?.response?.data?.message ?? 'Failed to delete'); }
  };

  const handleToggleStatus = async (product) => {
    const nextStatus = product.status === 'active' ? 'inactive' : 'active';
    try {
      await productsApi.updateProduct(product._id, { status: nextStatus });
      toast.success(`Product ${nextStatus}`);
      fetchProducts();
    } catch (err) { toast.error(err?.response?.data?.message ?? 'Failed to update'); }
  };

  const stockCls = (p) => p.currentStock <= 0 ? 'text-red-600' : p.currentStock <= p.minStockThreshold ? 'text-yellow-600' : 'text-green-600';
  const totalPages = Math.ceil(total / rowsPerPage);

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Manage your product catalog"
        actions={
          <button className="btn-primary btn-sm" onClick={openAdd}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Product
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4 items-start sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input className="input pl-9" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} />
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
                {['Product', 'SKU', 'Category', 'Unit', 'Cost', 'Price', 'Stock', 'Status', ''].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-10">
                  <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-10 text-gray-400">
                  {search ? 'No products match your search' : 'No products yet'}
                </td></tr>
              ) : products.map((p) => (
                <tr key={p._id} onClick={() => setSelectedProduct(p)}>
                  <td>
                    <p className="font-semibold text-gray-800 truncate max-w-[160px]">{p.name}</p>
                    {(p.brand || p.color) && (
                      <p className="text-xs text-gray-400">{[p.brand, p.color && `Color: ${p.color}`].filter(Boolean).join(' · ')}</p>
                    )}
                  </td>
                  <td><span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{p.sku}</span></td>
                  <td className="text-sm text-gray-600">{p.category || <span className="text-gray-300">—</span>}</td>
                  <td className="text-sm capitalize text-gray-600">{p.unit}</td>
                  <td className="text-sm text-gray-500">{fmtCur(p.purchaseCost)}</td>
                  <td className="font-semibold text-primary-600">{fmtCur(p.sellingPrice)}</td>
                  <td className={`font-bold text-sm ${stockCls(p)}`}>{p.currentStock}</td>
                  <td>
                    <span className={p.status === 'active' ? 'badge-success' : 'badge-default'}>
                      {p.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1">
                      <button className="icon-btn" title="Edit" onClick={() => openEdit(p)}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button className="icon-btn" title={p.status === 'active' ? 'Deactivate' : 'Activate'} onClick={() => handleToggleStatus(p)}>
                        <svg className={`w-4 h-4 ${p.status === 'active' ? 'text-green-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M18.36 6.64a9 9 0 11-12.73 0M12 2v10"/></svg>
                      </button>
                      <button className="icon-btn text-red-500 hover:bg-red-50" title="Delete" onClick={() => setDeleteTarget(p)}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6m4-6v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <span>{total} products</span>
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

      {/* Add / Edit Dialog */}
      {dialogOpen && (
        <div className="modal-overlay" onClick={() => setDialogOpen(false)}>
          <div className="modal-box max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header bg-primary-600 text-white">
              <h2 className="font-bold">{editProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="text-white/80 hover:text-white" onClick={() => setDialogOpen(false)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="modal-body">
              <form id="productForm" onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="label">Product Name *</label>
                    <input {...register('name')} className={`input ${errors.name ? 'input-error' : ''}`}
                      onBlur={() => { if (!watch('sku') && nameValue) setValue('sku', generateSKU(nameValue)); }} />
                    {errors.name && <p className="error-msg">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="label">SKU *</label>
                    <input {...register('sku')} className={`input ${errors.sku ? 'input-error' : ''}`} />
                    {errors.sku && <p className="error-msg">{errors.sku.message}</p>}
                  </div>
                  <div>
                    <label className="label">Category</label>
                    <select {...register('category')} className="input">
                      <option value="">— None —</option>
                      {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Brand</label>
                    <input {...register('brand')} className="input" />
                  </div>
                  <div>
                    <label className="label">Unit *</label>
                    <select {...register('unit')} className="input">
                      {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Purchase Cost (₹) *</label>
                    <input {...register('purchaseCost')} type="number" step="0.01" className={`input ${errors.purchaseCost ? 'input-error' : ''}`} />
                    {errors.purchaseCost && <p className="error-msg">{errors.purchaseCost.message}</p>}
                  </div>
                  <div>
                    <label className="label">Selling Price (₹) *</label>
                    <input {...register('sellingPrice')} type="number" step="0.01" className={`input ${errors.sellingPrice ? 'input-error' : ''}`} />
                    {errors.sellingPrice && <p className="error-msg">{errors.sellingPrice.message}</p>}
                  </div>
                  <div>
                    <label className="label">Current Stock</label>
                    <input {...register('currentStock')} type="number" min="0" className="input" disabled={!!editProduct} />
                  </div>
                  <div>
                    <label className="label">Min Stock Threshold *</label>
                    <input {...register('minStockThreshold')} type="number" min="1" className={`input ${errors.minStockThreshold ? 'input-error' : ''}`} />
                    {errors.minStockThreshold && <p className="error-msg">{errors.minStockThreshold.message}</p>}
                  </div>
                  <div>
                    <label className="label">Color / Variant</label>
                    <input {...register('color')} className="input" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Description</label>
                    <textarea {...register('description')} className="input" rows={2} />
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn-outline btn-sm" onClick={() => setDialogOpen(false)}>Cancel</button>
              <button className="btn-primary btn-sm" form="productForm" type="submit" disabled={saving}>
                {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {editProduct ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product detail panel */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-box max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="font-bold text-gray-800">{selectedProduct.name}</h2>
              <button className="icon-btn" onClick={() => setSelectedProduct(null)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="modal-body space-y-2 text-sm">
              {[
                ['SKU', <span className="font-mono">{selectedProduct.sku}</span>],
                ['Category', selectedProduct.category || '—'],
                ['Brand', selectedProduct.brand || '—'],
                ['Color', selectedProduct.color || '—'],
                ['Unit', selectedProduct.unit],
                ['Purchase Cost', fmtCur(selectedProduct.purchaseCost)],
                ['Selling Price', fmtCur(selectedProduct.sellingPrice)],
                ['Current Stock', <span className={`font-bold ${stockCls(selectedProduct)}`}>{selectedProduct.currentStock}</span>],
                ['Min Threshold', selectedProduct.minStockThreshold],
                ['Status', <span className={selectedProduct.status === 'active' ? 'badge-success' : 'badge-default'}>{selectedProduct.status}</span>],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between border-b border-gray-50 pb-1">
                  <span className="text-gray-400">{label}</span>
                  <span className="font-semibold text-gray-700">{val}</span>
                </div>
              ))}
            </div>
            <div className="modal-footer gap-2">
              <button className="btn-outline btn-sm" onClick={() => { setSelectedProduct(null); openEdit(selectedProduct); }}>Edit</button>
              <button className="btn-danger btn-sm" onClick={() => { setSelectedProduct(null); setDeleteTarget(selectedProduct); }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Product"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        severity="error"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
