import React from 'react';

const defaultStatusMap = {
  active:             { label: 'Active',     cls: 'badge-success' },
  inactive:           { label: 'Inactive',   cls: 'badge-default' },
  archived:           { label: 'Archived',   cls: 'badge-error' },
  draft:              { label: 'Draft',      cls: 'badge-warning' },
  confirmed:          { label: 'Confirmed',  cls: 'badge-success' },
  cancelled:          { label: 'Cancelled',  cls: 'badge-error' },
  returned:           { label: 'Returned',   cls: 'badge-warning' },
  paid:               { label: 'Paid',       cls: 'badge-success' },
  unpaid:             { label: 'Unpaid',     cls: 'badge-error' },
  partial:            { label: 'Partial',    cls: 'badge-warning' },
  ordered:            { label: 'Ordered',    cls: 'badge-info' },
  received:           { label: 'Received',   cls: 'badge-success' },
  partially_received: { label: 'Partial',    cls: 'badge-warning' },
  pending:            { label: 'Pending',    cls: 'badge-warning' },
  approved:           { label: 'Approved',   cls: 'badge-success' },
  rejected:           { label: 'Rejected',   cls: 'badge-error' },
  completed:          { label: 'Completed',  cls: 'badge-success' },
};

export default function StatusBadge({ status, statusMap }) {
  const map = { ...defaultStatusMap, ...(statusMap ?? {}) };
  const config = map[status] ?? { label: status, cls: 'badge-default' };
  return <span className={config.cls}>{config.label}</span>;
}
