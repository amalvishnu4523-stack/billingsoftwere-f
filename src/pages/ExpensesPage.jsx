import React from 'react';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';

export default function ExpensesPage() {
  return (
    <>
      <PageHeader title="Expenses" subtitle="Business expense tracking" />
      <div className="card">
        <EmptyState
          icon={<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
          title="Expenses Module Coming Soon"
          description="Track business expenses and overheads — coming in Phase 2."
        />
      </div>
    </>
  );
}
