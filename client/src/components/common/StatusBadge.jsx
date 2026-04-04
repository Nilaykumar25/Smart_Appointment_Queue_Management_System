import './StatusBadge.css';

const STATUS_CLASS = {
  'Booked':          'badge bg-primary',
  'Arrived':         'badge bg-warning text-dark',
  'In-Consultation': 'badge badge-consultation',
  'Completed':       'badge bg-success',
  'No-Show':         'badge bg-secondary',
};

function StatusBadge({ status }) {
  const cls = STATUS_CLASS[status] ?? 'badge bg-secondary';
  return <span className={`${cls} status-badge`}>{status}</span>;
}

export default StatusBadge;
