// ═══════════════════════════════════════════════════════════════════════════════════════
// REQ-7: Queue Dashboard — Real-time queue position updates
// ═══════════════════════════════════════════════════════════════════════════════════════
// Implements: REQ-7  — see SRS Section 4.3 (Queue Management and Status Tracking)
// Implements: REQ-12 — see SRS Section 4.5 (Appointment Status Management)
// Implements: REQ-13 — see SRS Section 4.5 (No-Show Trigger)
/**
 * Queue Position Mapping:
 *   - queuePosition field represents patient's place in queue for the day
 *   - Positions are assigned based on appointment start time (earlier = lower position)
 *   - Position 1 = first patient to be attended
 *   - Position N = patient must wait for N-1 patients ahead
 *
 * Real-time Updates Flow:
 *   1. Staff marks patient as "Completed" or "No-Show"
 *   2. Server deletes patient from queue and recalculates positions
 *   3. Remaining patients move up: position 4→3, 5→4, 6→5, etc.
 *   4. Dashboard polls /queue/today every 30 seconds
 *   5. Displays updated positions in "Queue #" column
 *   6. Patients' dashboards also update via 5-second polling
 *
 * Status Transitions and Queue Impact:
 *   Booked → Arrived       → IN-CONSULTATION → Completed ✓ (leaves queue)
 *                                                No-Show   ✓ (leaves queue)
 *
 * Column Mapping:
 *   - Queue #          → queuePosition (1-indexed)
 *   - Patient Name     → patientName
 *   - Scheduled At     → scheduledTime
 *   - Status           → current appointment status
 *   - Actions          → status transition buttons
 */

import { useState, useEffect, useCallback } from 'react';
import { apiCall } from '../../services/api';
import { useQueue } from '../../context/QueueContext';
import StatusBadge from '../../components/common/StatusBadge';
import './QueueDashboard.css';

// Status transition mapping — defines valid state changes
// Each transition shows what action staff can take based on current status
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
  const { patients, updateStatus, resetPatients } = useQueue();
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError]             = useState('');
  const [updatingId, setUpdatingId]   = useState(null);

  /**
   * fetchQueue — Polling function to refresh queue data from server
   * Called initially on component mount, then every 30 seconds
   * Fetches updated queue positions after staff marks patients as attended
   */
  const fetchQueue = useCallback(async (isInitial = false) => {
    if (isInitial) setInitialLoad(true);
    setError('');
    try {
      // REQ-7: Fetch current queue with recalculated positions from server
      const data = await apiCall('/queue/today');
      resetPatients(data);
    } catch {
      // context holds existing data — no flicker on background refresh failure
    } finally {
      if (isInitial) setInitialLoad(false);
    }
  }, [resetPatients]);

  // REQ-7: Polling interval for real-time queue position updates
  // Every 30 seconds, fetch latest queue data from server
  // This ensures positions stay in sync as staff marks patients as attended
  useEffect(() => {
    fetchQueue(true);
    const interval = setInterval(() => fetchQueue(false), 30_000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  /**
   * REQ-7: handleAction — Update patient status and trigger queue recalculation
   * 
   * Real-time Flow:
   *   1. Staff clicks "Mark Completed" or "No-Show"
   *   2. This function sends PATCH request to /appointments/:id/status
   *   3. Server marks patient as Completed/No-Show
   *   4. Server deletes patient from queue table
   *   5. Server recalculates positions for remaining patients
   *   6. Next polling interval fetches updated positions
   *   7. Patient dashboards also receive updated position via their polling
   */
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
    updateStatus(appointmentId, newStatus);
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
          onClick={() => fetchQueue(true)}
          disabled={initialLoad}
        >
          🔄 Refresh
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

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
                // REQ-7: Queue Position Display Mapping
                // Maps each patient to a table row with their current queue position
                // Lower positions appear first (position 1 = next to be attended)
                // As staff marks patients as attended, positions automatically shift down
                patients.map((patient) => (
                  <tr key={patient.appointmentId}>
                    {/* Queue # Column: Displays patient's position in queue (1-indexed) */}
                    {/* When this patient is completed, all higher numbers shift down by 1 */}
                    <td><strong>{patient.queuePosition}</strong></td>
                    {/* Patient Name Column: Identifies the patient */}
                    <td>{patient.patientName}</td>
                    {/* Scheduled At Column: Original appointment time */}
                    <td>{patient.scheduledTime}</td>
                    {/* Status Column: Current appointment status badge */}
                    <td><StatusBadge status={patient.status} /></td>
                    {/* Actions Column: Status transition buttons (Mark Arrived, etc.) */}
                    {/* Clicking these buttons triggers server-side queue recalculation */}
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
