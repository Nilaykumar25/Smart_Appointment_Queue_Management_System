// Implements: REQ-7  — see SRS Section 4.3 (Queue Management and Status Tracking)
// Implements: REQ-12 — see SRS Section 4.5 (Appointment Status Management)
// Implements: REQ-13 — see SRS Section 4.5 (No-Show Trigger)
//
// Enhanced Queue Dashboard Features:
//   - View queue for any selected date (not just today)
//   - Auto-refresh only for today's queue (every 30 seconds)
//   - Date picker with shortcuts for Today/Tomorrow
//   - Historical and future queue viewing
//   - Status updates work for any date
//   - Queue reordering works for any date
//
// Queue Position Mapping:
//   - queuePosition = patient's place in queue for the day
//   - Position 1 = first patient to be attended
//   - When a patient is Completed/No-Show, they leave the queue
//   - Dashboard polls /queue/today every 30 seconds for real-time updates (today only)
//
// Status Transitions:
//   Booked → Arrived → In-Consultation → Completed (leaves queue)
//                                      → No-Show   (leaves queue)

import { useState, useEffect, useCallback } from 'react';
import { apiCall } from '../../services/api';
import { useQueue } from '../../context/QueueContext';
import StatusBadge from '../../components/common/StatusBadge';
import { getTodayIST, getTomorrowIST, getDateIST, isToday, isTomorrow } from '../../utils/istDates';
import './QueueDashboard.css';

// Helper function to format date for display
function formatDateForDisplay(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  
  if (isToday(dateStr)) return 'Today';
  if (isTomorrow(dateStr)) return 'Tomorrow';
  
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
}

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
  const [selectedDate, setSelectedDate] = useState(() => getTodayIST()); // Use IST for initial date
  const [initialLoad, setInitialLoad]   = useState(true);
  const [error, setError]               = useState('');
  const [updatingId, setUpdatingId]     = useState(null);
  const [reorderingId, setReorderingId] = useState(null);
  const [reorderError, setReorderError] = useState('');

  // REQ-7: Poll every 30 seconds for real-time queue position updates
  // Enhanced to support any date, but only auto-refresh for today
  const fetchQueue = useCallback(async (isInitial = false) => {
    if (isInitial) setInitialLoad(true);
    setError('');
    try {
      // Use date-specific endpoint if not today, otherwise use existing today endpoint
      const todayIST = getTodayIST();
      const isToday = selectedDate === todayIST;
      const endpoint = isToday ? '/queue/today' : `/queue/date/${selectedDate}`;
      const data = await apiCall(endpoint);
      resetPatients(data);
    } catch (err) {
      console.error('Queue fetch error:', err);
      setError('Failed to load queue data. Please try again.');
      // context holds existing data — no flicker on background refresh failure
    } finally {
      if (isInitial) setInitialLoad(false);
    }
  }, [resetPatients, selectedDate]);

  useEffect(() => {
    fetchQueue(true);
    
    // Only auto-refresh for today's queue to avoid unnecessary API calls
    const todayIST = getTodayIST();
    const isToday = selectedDate === todayIST;
    if (isToday) {
      const interval = setInterval(() => fetchQueue(false), 30_000);
      return () => clearInterval(interval);
    }
  }, [fetchQueue, selectedDate]);

  // Handle date change
  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    setError('');
  };

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
      // Still update locally so UI stays responsive
      updateStatus(appointmentId, newStatus);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleReorder(appointmentId, direction) {
    setReorderingId(appointmentId + direction);
    setReorderError('');

    // Store original state in case we need to revert
    const originalPatients = [...patients];
    
    // Apply optimistic update
    reorderPatients(appointmentId, direction);

    try {
      // Pass the selected date to the reorder endpoint
      const result = await apiCall('/queue/reorder', {
        method: 'PATCH',
        body: { appointmentId, direction, date: selectedDate },
      });
      
      // Show success message with affected patients info
      if (result.affectedPatients) {
        const [patient1, patient2] = result.affectedPatients;
        console.log(`✅ Queue reordered: ${patient1.name} (${patient1.oldPosition}→${patient1.newPosition}), ${patient2.name} (${patient2.oldPosition}→${patient2.newPosition})`);
      }
      
      // Don't fetch queue again - keep the optimistic update since it was successful
      // The server has confirmed the change, so our optimistic update is correct
      
    } catch (err) {
      console.error('Reorder error:', err);
      
      // Handle boundary condition gracefully - revert optimistic update
      if (err.message && err.message.includes('Already at the boundary')) {
        // Revert to original state
        resetPatients(originalPatients);
      } else if (err.message && err.message.includes('Need at least 2 patients')) {
        // Revert to original state
        resetPatients(originalPatients);
        setReorderError('Need at least 2 patients in queue to reorder');
        setTimeout(() => setReorderError(''), 3000);
      } else {
        // Show error for unexpected failures and refresh from server
        setReorderError('Could not save new order. Refreshing...');
        await fetchQueue(false);
        setTimeout(() => setReorderError(''), 3000);
      }
    } finally {
      setReorderingId(null);
    }
  }

  const totalPatients = patients.length;
  const todayIST = getTodayIST();
  const isToday = selectedDate === todayIST;
  const displayDate = formatDateForDisplay(selectedDate);

  return (
    <div>
      <div className="queue-header">
        <div>
          <h2>Queue Dashboard</h2>
          <div className="patient-count">{totalPatients} patient{totalPatients !== 1 ? 's' : ''} scheduled</div>
        </div>
        <div className="queue-controls">
          <div className="date-selector">
            <label htmlFor="queue-date" className="form-label">View Date:</label>
            <div className="date-input-group">
              <input
                id="queue-date"
                type="date"
                className="form-control form-control-sm"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                min="2024-01-01"
                max={getDateIST(30)} // 30 days from today in IST
              />
              <div className="date-shortcuts">
                <button
                  type="button"
                  className={`btn btn-sm ${isToday ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => handleDateChange(getTodayIST())}
                >
                  Today
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => {
                    handleDateChange(getTomorrowIST());
                  }}
                >
                  Tomorrow
                </button>
              </div>
            </div>
          </div>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => fetchQueue(true)}
            disabled={initialLoad}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="queue-date-display">
        <h3>{displayDate}'s Queue</h3>
        {!isToday && (
          <div className="alert alert-info py-2">
            <small>
              📅 Viewing {selectedDate < getTodayIST() ? 'historical' : 'future'} queue. 
              Auto-refresh is {isToday ? 'enabled' : 'disabled'} for {isToday ? 'today' : 'non-today dates'}.
              {selectedDate < getTodayIST() && ' Status changes for past dates are not recommended.'}
            </small>
          </div>
        )}
        {isToday && totalPatients > 0 && (
          <div className="alert alert-success py-2">
            <small>
              🔄 Live updates every 30 seconds. Queue positions and wait times update automatically.
            </small>
          </div>
        )}
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
                <th>Slot Info</th>
                <th>Status</th>
                <th>Actions</th>
                <th style={{ width: '90px' }}>Reorder</th>
              </tr>
            </thead>
            <tbody>
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">
                    No patients in queue for {displayDate.toLowerCase()}.
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
                      <td>
                        <small className="text-muted">
                          {patient.patientsInSlot > 1 ? (
                            <span>
                              {patient.patientsInSlot}/{patient.slotCapacity || 3} in slot
                            </span>
                          ) : (
                            <span>Solo appointment</span>
                          )}
                        </small>
                      </td>
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
