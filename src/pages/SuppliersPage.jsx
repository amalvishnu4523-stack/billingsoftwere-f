import React from 'react';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';

export default function SuppliersPage() {
  return (
    <>
      <PageHeader title="Suppliers" subtitle="Supplier management" />
      <div className="card">
        <EmptyState
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>}
          title="Suppliers Module Coming Soon"
          description="Supplier profiles and contacts — coming in Phase 2."
        />
      </div>
    </>
  );
}
