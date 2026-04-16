// Implements: REQ-7  — see SRS Section 4.3 (Queue Management and Status Tracking)
// Implements: REQ-12 — see SRS Section 4.5 (Appointment Status Management)
// Implements: REQ-13 — see SRS Section 4.5 (No-Show Trigger)
//
// Queue Position Mapping:
//   - queuePosition = patient's place in queue for the day
//   - Position 1 = first patient to be attended
//   - When a patient is Completed/No-Show, they leave the queue
//   - Dashboard polls /queue/today every 30 seconds for real-time updates
//
// Status Transitions:
//   Booked → Arrived → In-Consultation → Completed (leaves queue)
//                                      → No-Show   (leaves queue)

import { useState, useEffect, useCallback } from 'react';
import { apiCall } from '../../services/api';
import { useQueue } from '../../context/QueueContext';
import StatusBadge from '../../components/common/StatusBadge';
import './QueueDashboard.css';

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
  const { patients, updateStatus, resetPatients, reorderPatients } = useQueue();
  const [initialLoad, setInitialLoad]   = useState(true);
  const [error, setError]               = useState('');
  const [updatingId, setUpdatingId]     = useState(null);
  const [reorderingId, setReorderingId] = useState(null);
  const [reorderError, setReorderError] = useState('');

  // REQ-7: Poll every 30 seconds for real-time queue position updates
  const fetchQueue = useCallback(async (isInitial = false) => {
    if (isInitial) setInitialLoad(true);
    setError('');
    try {
      const data = await apiCall('/queue/today');
      resetPatients(data);
    } catch {
      // context holds existing data — no flicker on background refresh failure
    } finally {
      if (isInitial) setInitialLoad(false);
    }
  }, [resetPatients]);

  useEffect(() => {
    fetchQueue(true);
    const interval = setInterval(() => fetchQueue(false), 30_000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  // Implements: REQ-12 — Real endpoint: PATCH /api/appointments/:id/status
  async function handleAction(appointmentId, newStatus) {
    setUpdatingId(appointmentId);
    try {
      await apiCall(`/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        body: { status: newStatus },
      });
      updateStatus(appointmentId, newStatus);
    } catch (err) {
      console.error('Status update error:', err);
      updateStatus(appointmentId, newStatus);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleReorder(appointmentId, direction) {
    setReorderingId(appointmentId + direction);
    setReorderError('');

    // Optimistic update — move instantly in UI
    reorderPatients(appointmentId, direction);

    try {
      await apiCall('/queue/reorder', {
        method: 'PATCH',
        body: { appointmentId, direction },
      });
    } catch (err) {
      console.error('Reorder error:', err);
      setReorderError('Could not save new order. Refreshing...');
      await fetchQueue(false);
      setTimeout(() => setReorderError(''), 3000);
    } finally {
      setReorderingId(null);
    }
  }

  const totalPatients = patients.length;

  return (
    <div>
      <div className="queue-header">
        <div>
          <h2>Today's Queue</h2>
          <div className="patient-count">{totalPatients} patient{totalPatients !== 1 ? 's' : ''} scheduled</div>
        </div>
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={() => fetchQueue(true)}
          disabled={initialLoad}
        >
          🔄 Refresh
        </button>
      </div>

      {error        && <div className="alert alert-danger">{error}</div>}
      {reorderError && <div className="alert alert-warning">{reorderError}</div>}

      {initialLoad ? (
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
                <th style={{ width: '90px' }}>Queue #</th>
                <th>Patient Name</th>
                <th>Scheduled At</th>
                <th>Status</th>
                <th>Actions</th>
                <th style={{ width: '90px' }}>Reorder</th>
              </tr>
            </thead>
            <tbody>
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    No patients in queue today.
                  </td>
                </tr>
              ) : (
                patients.map((patient, idx) => {
                  const isFirst = idx === 0;
                  const isLast  = idx === patients.length - 1;
                  const isReordering = reorderingId === patient.appointmentId + 'up'
                                    || reorderingId === patient.appointmentId + 'down';

                  return (
                    <tr key={patient.appointmentId}>
                      <td><strong>{patient.queuePosition ?? idx + 1}</strong></td>
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
                      <td>
                        <div className="reorder-cell">
                          <button
                            className="btn btn-sm btn-outline-secondary reorder-btn"
                            title="Move up"
                            disabled={isFirst || isReordering || !!updatingId}
                            onClick={() => handleReorder(patient.appointmentId, 'up')}
                          >
                            {reorderingId === patient.appointmentId + 'up'
                              ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                              : '↑'}
                          </button>
                          <button
                            className="btn btn-sm btn-outline-secondary reorder-btn"
                            title="Move down"
                            disabled={isLast || isReordering || !!updatingId}
                            onClick={() => handleReorder(patient.appointmentId, 'down')}
                          >
                            {reorderingId === patient.appointmentId + 'down'
                              ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                              : '↓'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default QueueDashboard;
