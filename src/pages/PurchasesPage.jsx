import React from 'react';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';

export default function PurchasesPage() {
  return (
    <>
      <PageHeader title="Purchases" subtitle="Purchase order management" />
      <div className="card">
        <EmptyState
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>}
          title="Purchases Module Coming Soon"
          description="Purchase orders and supplier management — coming in Phase 2."
        />
      </div>
    </>
  );
}
