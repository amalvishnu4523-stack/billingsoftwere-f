import React from 'react';
import PageHeader from '../components/common/PageHeader';
import EmptyState from '../components/common/EmptyState';

export default function InventoryPage() {
  return (
    <>
      <PageHeader title="Inventory" subtitle="Stock management and movement history" />
      <div className="card">
        <EmptyState
          icon={
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          }
          title="Inventory Module Coming Soon"
          description="Full stock movement and inventory tracking — coming in Phase 2."
        />
      </div>
    </>
  );
}
