import React from 'react';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';

export default function CustomersPage() {
  return (
    <>
      <PageHeader title="Customers" subtitle="Customer management" />
      <div className="card">
        <EmptyState
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/></svg>}
          title="Customers Module Coming Soon"
          description="Customer profiles and history — coming in Phase 2."
        />
      </div>
    </>
  );
}
