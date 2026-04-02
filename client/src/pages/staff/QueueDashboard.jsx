// Implements: REQ-7  — see SRS Section 4.3 (Queue Management and Status Tracking)
// Implements: REQ-12 — see SRS Section 4.5 (Appointment Status Management)
// Implements: REQ-13 — see SRS Section 4.5 (No-Show Trigger)

import { useState, useEffect, useCallback } from 'react';
import { apiCall } from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';
import './QueueDashboard.css';

// TODO: Remove mock data when backend is ready
const MOCK_PATIENTS = [
  { appointmentId: 'A001', patientName: 'Rahul Sharma',  queuePosition: 1, scheduledTime: '10:00 AM', status: 'Booked'          },
  { appointmentId: 'A002', patientName: 'Priya Singh',   queuePosition: 2, scheduledTime: '10:15 AM', status: 'Arrived'         },
  { appointmentId: 'A003', patientName: 'Amit Verma',    queuePosition: 3, scheduledTime: '10:30 AM', status: 'In-Consultation' },
  { appointmentId: 'A004', patientName: 'Sneha Patel',   queuePosition: 4, scheduledTime: '10:45 AM', status: 'Completed'       },
  { appointmentId: 'A005', patientName: 'Rohan Das',     queuePosition: 5, scheduledTime: '11:00 AM', status: 'No-Show'         },
];

const NEXT_STATUS = {
  'Booked_Mark Arrived':          'Arrived',
  'Arrived_Start Consultation':   'In-Consultation',
  'In-Consultation_Mark Completed': 'Completed',
};

function ActionButtons({ patient, updatingId, onAction }) {
  const { appointmentId, status } = patient;
  const isUpdating = updatingId === appointmentId;

  const btn = (label, variant, nextStatus) => (
    <button
      className={`btn btn-sm ${variant}`}
      disabled={isUpdating}
      onClick={() => onAction(appointmentId, nextStatus)}
    >
      {isUpdating && (
        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
      )}
      {label}
    </button>
  );

  if (status === 'Booked') return (
    <div className="action-cell">
      {btn('Mark Arrived', 'btn-primary', 'Arrived')}
      {btn('No-Show', 'btn-outline-danger', 'No-Show')}
    </div>
  );

  if (status === 'Arrived') return (
    <div className="action-cell">
      {btn('Start Consultation', 'btn-warning', 'In-Consultation')}
      {btn('No-Show', 'btn-outline-danger', 'No-Show')}
    </div>
  );

  if (status === 'In-Consultation') return (
    <div className="action-cell">
      {btn('Mark Completed', 'btn-success', 'Completed')}
    </div>
  );

  return <span className="text-muted">—</span>;
}

function QueueDashboard() {
  const [patients, setPatients]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiCall('/queue/today');
      setPatients(data);
    } catch {
      // TODO: Remove mock fallback when backend is ready
      setPatients(MOCK_PATIENTS);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + 30-second auto-refresh
  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 30_000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  async function handleAction(appointmentId, newStatus) {
    setUpdatingId(appointmentId);
    try {
      await apiCall(`/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        body: { status: newStatus },
      });
    } catch {
      // API not ready — update locally
    }
    setPatients((prev) =>
      prev.map((p) =>
        p.appointmentId === appointmentId ? { ...p, status: newStatus } : p
      )
    );
    setUpdatingId(null);
  }

  return (
    <div>
      <div className="queue-header">
        <div>
          <h2>Today's Queue</h2>
          <div className="patient-count">{patients.length} patients scheduled</div>
        </div>
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={fetchQueue}
          disabled={loading}
        >
          🔄 Refresh
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-light">
              <tr>
                <th>Queue #</th>
                <th>Patient Name</th>
                <th>Scheduled At</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    No patients in queue today.
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr key={patient.appointmentId}>
                    <td><strong>{patient.queuePosition}</strong></td>
                    <td>{patient.patientName}</td>
                    <td>{patient.scheduledTime}</td>
                    <td><StatusBadge status={patient.status} /></td>
                    <td>
                      <ActionButtons
                        patient={patient}
                        updatingId={updatingId}
                        onAction={handleAction}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default QueueDashboard;
