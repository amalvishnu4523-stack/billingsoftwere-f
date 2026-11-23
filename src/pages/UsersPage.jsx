import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import PageHeader from '../components/common/PageHeader';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { usersApi } from '../api/users';
import { useAuthStore } from '../store/authStore';

const createSchema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 chars'),
  role: z.enum(['admin', 'sales']),
});

const editSchema = z.object({
  name: z.string().min(1, 'Required'),
  role: z.enum(['admin', 'sales']),
  isActive: z.boolean(),
});

const passwordSchema = z.object({
  newPassword: z.string().min(8, 'Min 8 chars'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

function initials(name) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function EyeIcon({ visible }) {
  return visible
    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}

export default function UsersPage() {
  const { user: me } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [passwordTarget, setPasswordTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const createForm = useForm({ resolver: zodResolver(createSchema), defaultValues: { role: 'sales' } });
  const editForm = useForm({ resolver: zodResolver(editSchema) });
  const passwordForm = useForm({ resolver: zodResolver(passwordSchema) });

  const fetchUsers = async () => {
    try { setUsers(await usersApi.getAll()); }
    catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (data) => {
    setSaving(true);
    try {
      await usersApi.create(data);
      toast.success('User created');
      setCreateOpen(false);
      createForm.reset({ role: 'sales' });
      fetchUsers();
    } catch (err) { toast.error(err?.response?.data?.message ?? 'Failed to create user'); }
    finally { setSaving(false); }
  };

  const openEdit = (u) => { setEditTarget(u); editForm.reset({ name: u.name, role: u.role, isActive: u.isActive }); };

  const handleEdit = async (data) => {
    if (!editTarget) return;
    setSaving(true);
    try {
      await usersApi.update(editTarget._id, data);
      toast.success('User updated');
      setEditTarget(null);
      fetchUsers();
    } catch (err) { toast.error(err?.response?.data?.message ?? 'Failed to update'); }
    finally { setSaving(false); }
  };

  const handleResetPassword = async (data) => {
    if (!passwordTarget) return;
    setSaving(true);
    try {
      await usersApi.resetPassword(passwordTarget._id, data.newPassword);
      toast.success('Password reset');
      setPasswordTarget(null);
      passwordForm.reset();
    } catch { toast.error('Failed to reset password'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await usersApi.delete(deleteTarget._id);
      toast.success('User deleted');
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) { toast.error(err?.response?.data?.message ?? 'Failed to delete'); }
  };

  return (
    <div>
      <PageHeader
        title="Users & Roles"
        subtitle="Manage admin and billing staff accounts"
        actions={
          <button className="btn-primary btn-sm" onClick={() => { createForm.reset({ role: 'sales' }); setCreateOpen(true); }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add User
          </button>
        }
      />

      {loading ? (
        <div className="flex justify-center mt-12"><div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : users.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">No users found.</div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u._id} className="card px-4 py-3 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0 ${u.role === 'admin' ? 'bg-primary-600' : 'bg-gray-400'}`}>
                {initials(u.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-800 truncate">{u.name}</p>
                  {u._id === me?.id && <span className="badge-success text-[10px]">You</span>}
                  {!u.isActive && <span className="badge-error text-[10px]">Inactive</span>}
                </div>
                <p className="text-sm text-gray-400 truncate">{u.email}</p>
              </div>
              <span className={`hidden sm:inline-flex ${u.role === 'admin' ? 'badge-primary' : 'badge-default'}`}>
                {u.role === 'admin' ? 'Admin' : 'Sales Staff'}
              </span>
              <p className="hidden md:block text-xs text-gray-400 min-w-[130px] text-right">
                {u.lastLogin ? `Last: ${new Date(u.lastLogin).toLocaleDateString('en-IN')}` : 'Never logged in'}
              </p>
              {u._id !== me?.id && (
                <div className="flex gap-1">
                  <button className="icon-btn" title="Edit" onClick={() => openEdit(u)}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button className="icon-btn text-yellow-600 hover:bg-yellow-50" title="Reset Password" onClick={() => { setPasswordTarget(u); passwordForm.reset(); }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  </button>
                  <button className="icon-btn text-red-500 hover:bg-red-50" title="Delete" onClick={() => setDeleteTarget(u)}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      {createOpen && (
        <div className="modal-overlay" onClick={() => setCreateOpen(false)}>
          <div className="modal-box max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="font-bold text-gray-800">Add New User</h2>
              <button className="icon-btn" onClick={() => setCreateOpen(false)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="modal-body space-y-3">
              {[{ name: 'name', label: 'Full Name *', type: 'text' }, { name: 'email', label: 'Email *', type: 'email' }].map(({ name, label, type }) => (
                <div key={name}>
                  <label className="label">{label}</label>
                  <input {...createForm.register(name)} type={type} className={`input ${createForm.formState.errors[name] ? 'input-error' : ''}`} />
                  {createForm.formState.errors[name] && <p className="error-msg">{createForm.formState.errors[name].message}</p>}
                </div>
              ))}
              <div>
                <label className="label">Password *</label>
                <div className="relative">
                  <input {...createForm.register('password')} type={showPw ? 'text' : 'password'} className={`input pr-10 ${createForm.formState.errors.password ? 'input-error' : ''}`} />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowPw((v) => !v)}>
                    <EyeIcon visible={showPw} />
                  </button>
                </div>
                {createForm.formState.errors.password && <p className="error-msg">{createForm.formState.errors.password.message}</p>}
              </div>
              <div>
                <label className="label">Role *</label>
                <select {...createForm.register('role')} className="input">
                  <option value="admin">Admin — Full access</option>
                  <option value="sales">Sales Staff — Billing only</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline btn-sm" onClick={() => setCreateOpen(false)}>Cancel</button>
              <button className="btn-primary btn-sm" onClick={createForm.handleSubmit(handleCreate)} disabled={saving}>
                {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {editTarget && (
        <div className="modal-overlay" onClick={() => setEditTarget(null)}>
          <div className="modal-box max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="font-bold text-gray-800">Edit User</h2>
              <button className="icon-btn" onClick={() => setEditTarget(null)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="modal-body space-y-3">
              <div>
                <label className="label">Full Name *</label>
                <input {...editForm.register('name')} className={`input ${editForm.formState.errors.name ? 'input-error' : ''}`} />
                {editForm.formState.errors.name && <p className="error-msg">{editForm.formState.errors.name.message}</p>}
              </div>
              <div>
                <label className="label">Role *</label>
                <select {...editForm.register('role')} className="input">
                  <option value="admin">Admin</option>
                  <option value="sales">Sales Staff</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="isActive" className="w-4 h-4 accent-primary-600" {...editForm.register('isActive')} />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active Account</label>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline btn-sm" onClick={() => setEditTarget(null)}>Cancel</button>
              <button className="btn-primary btn-sm" onClick={editForm.handleSubmit(handleEdit)} disabled={saving}>
                {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Dialog */}
      {passwordTarget && (
        <div className="modal-overlay" onClick={() => setPasswordTarget(null)}>
          <div className="modal-box max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="font-bold text-gray-800">Reset Password — {passwordTarget.name}</h2>
              <button className="icon-btn" onClick={() => setPasswordTarget(null)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="modal-body space-y-3">
              <div>
                <label className="label">New Password *</label>
                <div className="relative">
                  <input {...passwordForm.register('newPassword')} type={showPw ? 'text' : 'password'} className={`input pr-10 ${passwordForm.formState.errors.newPassword ? 'input-error' : ''}`} />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" onClick={() => setShowPw((v) => !v)}>
                    <EyeIcon visible={showPw} />
                  </button>
                </div>
                {passwordForm.formState.errors.newPassword && <p className="error-msg">{passwordForm.formState.errors.newPassword.message}</p>}
              </div>
              <div>
                <label className="label">Confirm Password *</label>
                <input {...passwordForm.register('confirmPassword')} type={showPw ? 'text' : 'password'} className={`input ${passwordForm.formState.errors.confirmPassword ? 'input-error' : ''}`} />
                {passwordForm.formState.errors.confirmPassword && <p className="error-msg">{passwordForm.formState.errors.confirmPassword.message}</p>}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-outline btn-sm" onClick={() => setPasswordTarget(null)}>Cancel</button>
              <button className="btn-warning btn-sm" onClick={passwordForm.handleSubmit(handleResetPassword)} disabled={saving}>
                {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete User"
        message={`Delete "${deleteTarget?.name}"? They will lose access immediately.`}
        confirmLabel="Delete" severity="error"
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
