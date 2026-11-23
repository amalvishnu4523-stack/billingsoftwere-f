import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../components/common/PageHeader';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { categoriesApi } from '../api/categories';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = async () => {
    try {
      setCategories(await categoriesApi.getAll());
    } catch { toast.error('Failed to load categories'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchCategories(); }, []);

  const openAdd = () => { setEditTarget(null); setName(''); setDescription(''); setNameError(''); setDialogOpen(true); };
  const openEdit = (cat) => { setEditTarget(cat); setName(cat.name); setDescription(cat.description ?? ''); setNameError(''); setDialogOpen(true); };

  const handleSave = async () => {
    if (!name.trim()) { setNameError('Category name is required'); return; }
    setSaving(true);
    try {
      if (editTarget) {
        await categoriesApi.update(editTarget._id, { name: name.trim(), description: description.trim() || undefined });
        toast.success('Category updated');
      } else {
        await categoriesApi.create({ name: name.trim(), description: description.trim() || undefined });
        toast.success('Category created');
      }
      setDialogOpen(false);
      fetchCategories();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await categoriesApi.delete(deleteTarget._id);
      toast.success('Category deleted');
      setDeleteTarget(null);
      fetchCategories();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to delete');
    } finally { setDeleting(false); }
  };

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Manage product categories"
        actions={
          <button className="btn-primary btn-sm" onClick={openAdd}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Category
          </button>
        }
      />

      {loading ? (
        <div className="flex justify-center mt-12"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : categories.length === 0 ? (
        <div className="card py-16 text-center">
          <svg className="w-14 h-14 text-gray-200 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          <p className="font-semibold text-gray-600">No categories yet</p>
          <p className="text-sm text-gray-400 mb-3">Add your first category to organise products</p>
          <button className="btn-primary btn-sm" onClick={openAdd}>Add Category</button>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat._id} className="card px-4 py-3 flex items-center gap-3">
              <svg className="w-5 h-5 text-primary-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800">{cat.name}</p>
                {cat.description && <p className="text-sm text-gray-400">{cat.description}</p>}
              </div>
              <span className="badge-default text-xs">{new Date(cat.createdAt).toLocaleDateString('en-IN')}</span>
              <button className="icon-btn" title="Edit" onClick={() => openEdit(cat)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button className="icon-btn text-red-500 hover:bg-red-50" title="Delete" onClick={() => setDeleteTarget(cat)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6m4-6v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      {dialogOpen && (
        <div className="modal-overlay" onClick={() => setDialogOpen(false)}>
          <div className="modal-box max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="text-base font-bold">{editTarget ? 'Edit Category' : 'Add Category'}</h2>
              <button className="icon-btn" onClick={() => setDialogOpen(false)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="modal-body space-y-3">
              <div>
                <label className="label">Category Name *</label>
                <input
                  className={`input ${nameError ? 'input-error' : ''}`}
                  value={name} autoFocus
                  onChange={(e) => { setName(e.target.value); setNameError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
                />
                {nameError && <p className="error-msg">{nameError}</p>}
              </div>
              <div>
                <label className="label">Description (optional)</label>
                <textarea className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline btn-sm" onClick={() => setDialogOpen(false)}>Cancel</button>
              <button className="btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {editTarget ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Category"
        message={`Delete "${deleteTarget?.name}"? This will fail if any products are using this category.`}
        confirmLabel="Delete"
        severity="error"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
