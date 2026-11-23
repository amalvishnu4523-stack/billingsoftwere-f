import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import authApi from '../api/auth';

const schema = z.object({
  shopName: z.string().min(2, 'At least 2 characters'),
  name: z.string().min(2, 'At least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string().min(1, 'Required'),
}).refine((d) => d.password === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] });

export default function SetupPage() {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { shopName: '', name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (values) => {
    try {
      await authApi.setup({ shopName: values.shopName, name: values.name, email: values.email, password: values.password });
      setSuccess(true);
      toast.success('Admin account created!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      if (err?.response?.status === 409) {
        toast.error('Setup already completed. Redirecting…');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        toast.error(err?.response?.data?.message ?? err?.message ?? 'Setup failed');
      }
    }
  };

  const EyeIcon = ({ visible }) => visible
    ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-primary-600 rounded-xl flex items-center justify-center mb-3">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-primary-600">Initial Setup</h1>
          <p className="text-sm text-gray-500">Create your admin account</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-4">
              {[
                { name: 'shopName', label: 'Shop Name', type: 'text' },
                { name: 'name', label: 'Admin Full Name', type: 'text' },
                { name: 'email', label: 'Email Address', type: 'email' },
              ].map(({ name, label, type }) => (
                <div key={name}>
                  <label className="label">{label}</label>
                  <input {...register(name)} type={type} className={`input ${errors[name] ? 'input-error' : ''}`} />
                  {errors[name] && <p className="error-msg">{errors[name].message}</p>}
                </div>
              ))}

              {['password', 'confirmPassword'].map((name) => (
                <div key={name}>
                  <label className="label">{name === 'password' ? 'Password' : 'Confirm Password'}</label>
                  <div className="relative">
                    <input {...register(name)} type={showPw ? 'text' : 'password'} className={`input pr-10 ${errors[name] ? 'input-error' : ''}`} />
                    {name === 'password' && (
                      <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPw((v) => !v)}>
                        <EyeIcon visible={showPw} />
                      </button>
                    )}
                  </div>
                  {errors[name] && <p className="error-msg">{errors[name].message}</p>}
                </div>
              ))}

              <button type="submit" className="btn-primary w-full btn-lg" disabled={isSubmitting || success}>
                {isSubmitting && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {isSubmitting ? 'Creating…' : success ? 'Created!' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>

        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
