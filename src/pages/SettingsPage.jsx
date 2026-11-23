import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import PageHeader from '../components/common/PageHeader';
import { settingsApi } from '../api/settings';
import { useAuthStore } from '../store/authStore';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8, 'Min 8 characters'),
  confirmPassword: z.string().min(1, 'Required'),
}).refine((d) => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })
  .refine((d) => d.currentPassword !== d.newPassword, { message: 'New password must differ', path: ['newPassword'] });

function initials(name) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function EyeIcon({ visible }) {
  return visible
    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}

function SectionCard({ title, icon, children }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
        <div className="text-primary-600">{icon}</div>
        <h2 className="font-bold text-gray-800">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '' },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const handleProfileSave = async (data) => {
    setSavingProfile(true);
    try {
      await settingsApi.updateProfile({ name: data.name });
      const stored = localStorage.getItem('erp_user');
      if (stored) localStorage.setItem('erp_user', JSON.stringify({ ...JSON.parse(stored), name: data.name }));
      toast.success('Profile updated');
      setEditing(false);
    } catch { toast.error('Failed to update profile'); }
    finally { setSavingProfile(false); }
  };

  const handlePasswordSave = async (data) => {
    setSavingPassword(true);
    try {
      await settingsApi.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password changed successfully');
      passwordForm.reset();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to change password');
    } finally { setSavingPassword(false); }
  };

  const PersonIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  );
  const LockIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  );

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your account" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Profile Card */}
        <SectionCard title="Profile" icon={<PersonIcon />}>
          {/* Avatar */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-14 h-14 rounded-full bg-primary-600 text-white text-xl font-bold flex items-center justify-center shrink-0">
              {user?.name ? initials(user.name) : 'U'}
            </div>
            <div>
              <p className="font-bold text-gray-800">{user?.name}</p>
              <p className="text-sm text-gray-400">{user?.email}</p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${user?.role === 'admin' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'}`}>
                {user?.role}
              </span>
            </div>
          </div>

          {!editing ? (
            <div className="space-y-3">
              {[
                ['Full Name', user?.name],
                ['Email', user?.email],
                ['Role', user?.role],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-400">{label}</span>
                  <span className="text-sm font-semibold text-gray-700 capitalize">{val}</span>
                </div>
              ))}
              <button
                className="btn-outline-primary w-full mt-2"
                onClick={() => { profileForm.reset({ name: user?.name ?? '' }); setEditing(true); }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit Profile
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="label">Full Name</label>
                <input {...profileForm.register('name')} className={`input ${profileForm.formState.errors.name ? 'input-error' : ''}`} autoFocus />
                {profileForm.formState.errors.name && <p className="error-msg">{profileForm.formState.errors.name.message}</p>}
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input bg-gray-50 text-gray-400" value={user?.email ?? ''} disabled />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>
              <div className="flex gap-2">
                <button className="btn-primary flex-1" disabled={savingProfile} onClick={profileForm.handleSubmit(handleProfileSave)}>
                  {savingProfile && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Save
                </button>
                <button className="btn-outline flex-1" onClick={() => { profileForm.reset({ name: user?.name ?? '' }); setEditing(false); }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </SectionCard>

        {/* Change Password Card */}
        <SectionCard title="Change Password" icon={<LockIcon />}>
          <div className="space-y-3">
            <div>
              <label className="label">Current Password</label>
              <div className="relative">
                <input {...passwordForm.register('currentPassword')} type={showCurrent ? 'text' : 'password'}
                  className={`input pr-10 ${passwordForm.formState.errors.currentPassword ? 'input-error' : ''}`} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowCurrent((v) => !v)}>
                  <EyeIcon visible={showCurrent} />
                </button>
              </div>
              {passwordForm.formState.errors.currentPassword && <p className="error-msg">{passwordForm.formState.errors.currentPassword.message}</p>}
            </div>

            <div>
              <label className="label">New Password</label>
              <div className="relative">
                <input {...passwordForm.register('newPassword')} type={showNew ? 'text' : 'password'}
                  className={`input pr-10 ${passwordForm.formState.errors.newPassword ? 'input-error' : ''}`} />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowNew((v) => !v)}>
                  <EyeIcon visible={showNew} />
                </button>
              </div>
              {passwordForm.formState.errors.newPassword && <p className="error-msg">{passwordForm.formState.errors.newPassword.message}</p>}
            </div>

            <div>
              <label className="label">Confirm New Password</label>
              <input {...passwordForm.register('confirmPassword')} type={showNew ? 'text' : 'password'}
                className={`input ${passwordForm.formState.errors.confirmPassword ? 'input-error' : ''}`} />
              {passwordForm.formState.errors.confirmPassword && <p className="error-msg">{passwordForm.formState.errors.confirmPassword.message}</p>}
            </div>

            <button className="btn-warning w-full mt-1" disabled={savingPassword} onClick={passwordForm.handleSubmit(handlePasswordSave)}>
              {savingPassword && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <LockIcon />
              {savingPassword ? 'Saving…' : 'Change Password'}
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
