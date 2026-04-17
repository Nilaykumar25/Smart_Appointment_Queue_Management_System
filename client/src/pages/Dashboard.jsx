/**
 * ========================================
 * DASHBOARD PAGE COMPONENT
 * Main user interface for authenticated patients
 * ========================================
 * Route: /dashboard (Protected — authenticated users only)
 * Redirects non-authenticated users to /login
 *
 * Modules rendered:
 *  1. Statistics Tiles  — quick KPIs (appointments, queue, est. wait time)
 *  2. Upcoming Appointments — list of booked visits with manage action
 *  3. Queue Status      — REQ-7 & REQ-8 live position + wait time
 *  4. Medical Records   — placeholder for future visit history
 *  5. Notifications     — placeholder for alert feed
 *
 * Loading strategy:
 *  - isLoading flag drives a 800 ms shimmer skeleton so the layout
 *    never flashes empty before data arrives from localStorage.
 *
 * Polling strategy (REQ-14):
 *  - Queue data is refreshed every 5 seconds via a debounced helper
 *    to avoid excessive reads during rapid consecutive triggers.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getToken } from '../services/auth';
import RescheduleCancel from '../components/RescheduleCancel';
// REQ-14: Debounce utility prevents excessive queue-refresh calls during polling
import { debounce } from '../utils/debounce';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Dashboard = () => {
  // ── Auth context ──────────────────────────────────────────────────────────
  const { user } = useAuth();

  // ── Appointment state ─────────────────────────────────────────────────────
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [totalAppointments, setTotalAppointments]       = useState(0);
  const [completedAppointments, setCompletedAppointments] = useState(0);

  // ── REQ-7: Queue Position / REQ-8: Estimated Wait Time ───────────────────
  const [queuePosition, setQueuePosition]       = useState(null);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState(null);
  const [isInQueue, setIsInQueue]               = useState(false);

  // ── REQ-6: Reschedule/Cancel modal state ─────────────────────────────────
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // ── Loading state — shows skeleton UI while localStorage data is read ─────
  const [isLoading, setIsLoading] = useState(true);

  // ── Notifications (REQ-16) ────────────────────────────────────────────────
  const [notifications, setNotifications] = useState([]);

  // ── REQ-14: Ref holds the debounced refresh function across renders ───────
  const debouncedQueueRefreshRef = useRef(null);

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAppointments();
      loadQueueData();
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {}, 60_000);
    return () => clearInterval(timer);
  }, [upcomingAppointments]);

  /**
   * REQ-14: Debounced queue polling every 5 seconds
   */
  useEffect(() => {
    debouncedQueueRefreshRef.current = debounce(() => {
      try {
        loadQueueData();
      } catch (err) {
        console.error('[REQ-14] Error in debounced queue refresh:', err);
      }
    }, 2000);

    const pollInterval = setInterval(() => {
      debouncedQueueRefreshRef.current?.();
    }, 5000);

    return () => {
      clearInterval(pollInterval);
      debouncedQueueRefreshRef.current = null;
    };
  }, []);

  // REQ-16: Fetch notifications for the logged-in patient
  useEffect(() => {
    async function fetchNotifications() {
      try {
        const token = localStorage.getItem('saqms_token');
        if (!token) return;
        const res = await fetch(`${BASE_URL}/notifications/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setNotifications(data.notifications || []);
      } catch {
        // silently fail — notifications are non-critical
      }
    }
    fetchNotifications();
  }, []);

  // ==========================================================================
  // DATA LOADERS
  // ==========================================================================

  const loadAppointments = () => {
    try {
      const raw = localStorage.getItem('userAppointments');
      if (raw) {
        const allAppointments = JSON.parse(raw);
        
        // Filter to show only future appointments (including date and time)
        const now = new Date();
        
        const futureAppointments = allAppointments
          .filter(appointment => {
            // Combine date and time to create full appointment datetime
            const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
            return appointmentDateTime > now;
          })
          .sort((a, b) => {
            // Sort by date and time (earliest first)
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateA - dateB;
          });
        
        setUpcomingAppointments(futureAppointments);
        setTotalAppointments(futureAppointments.length);
        
        // Load queue data for the most recent (next) appointment
        if (futureAppointments.length > 0) {
          loadQueueDataForAppointment(futureAppointments[0]);
        }
      }
    } catch (err) {
      console.error('Error loading appointments:', err);
    }
  };

  /**
   * Load queue data for a specific appointment
   */
  const loadQueueDataForAppointment = async (appointment) => {
    try {
      if (!appointment?.appointment_id) {
        console.log('[Queue] No appointment_id found');
        setIsInQueue(false);
        return;
      }

      // Fetch queue data from API for this specific appointment
      const userId = user?.userId;
      if (!userId) {
        console.log('[Queue] No userId found');
        return;
      }

      console.log('[Queue] Fetching queue data for user:', userId);
      const response = await fetch(`${BASE_URL}/appointments/queue/${userId}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('[Queue] Response status:', response.status);

      if (response.ok) {
        const queueData = await response.json();
        console.log('[Queue] Queue data received:', queueData);
        setQueuePosition(queueData.position ?? null);
        setEstimatedWaitTime(queueData.estimated_wait_time ?? null);
        setIsInQueue(queueData.position != null);
      } else {
        const errorText = await response.text();
        console.log('[Queue] Error response:', errorText);
        setQueuePosition(null);
        setEstimatedWaitTime(null);
        setIsInQueue(false);
      }
    } catch (err) {
      console.error('[Queue] Error loading queue data:', err);
      setIsInQueue(false);
    }
  };

  /**
   * REQ-7 & REQ-8: Load queue position and estimated wait time from database
   */
  const loadQueueData = async () => {
    try {
      const userId = user?.userId;
      if (!userId) {
        setIsInQueue(false);
        return;
      }

      // Fetch queue data from API
      const response = await fetch(`${BASE_URL}/appointments/queue/${userId}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const queueData = await response.json();
        setQueuePosition(queueData.position ?? null);
        setEstimatedWaitTime(queueData.estimated_wait_time ?? null);
        setIsInQueue(queueData.position != null);
        
        // Also update localStorage for offline access
        localStorage.setItem('userQueueData', JSON.stringify({
          position: queueData.position,
          estimatedWaitTime: queueData.estimated_wait_time
        }));
      } else if (response.status === 404) {
        // Not in queue
        setQueuePosition(null);
        setEstimatedWaitTime(null);
        setIsInQueue(false);
        localStorage.removeItem('userQueueData');
      } else {
        // Fallback to localStorage if API fails
        const raw = localStorage.getItem('userQueueData');
        if (raw) {
          const queue = JSON.parse(raw);
          setQueuePosition(queue.position ?? null);
          setEstimatedWaitTime(queue.estimatedWaitTime ?? null);
          setIsInQueue(queue.position != null);
        }
      }
    } catch (err) {
      console.error('Error loading queue data:', err);
      // Fallback to localStorage on error
      try {
        const raw = localStorage.getItem('userQueueData');
        if (raw) {
          const queue = JSON.parse(raw);
          setQueuePosition(queue.position ?? null);
          setEstimatedWaitTime(queue.estimatedWaitTime ?? null);
          setIsInQueue(queue.position != null);
        } else {
          setIsInQueue(false);
        }
      } catch {
        setIsInQueue(false);
      }
    }
  };

  // ==========================================================================
  // UTILITY FUNCTIONS
  // ==========================================================================

  const formatDate = (dateString) =>
    new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      year:    'numeric',
      month:   'short',
      day:     'numeric',
    });

  // ==========================================================================
  // REQ-6: MODAL HANDLERS (Reschedule / Cancel)
  // ==========================================================================

  const handleOpenRescheduleModal = (appointment) => {
    setSelectedAppointment(appointment);
    setRescheduleModalOpen(true);
  };

  const handleRescheduleAppointment = (rescheduled) => {
    const updated = upcomingAppointments.map((apt) =>
      apt.id === rescheduled.id ? rescheduled : apt
    );
    setUpcomingAppointments(updated);
    localStorage.setItem('userAppointments', JSON.stringify(updated));
    setRescheduleModalOpen(false);
    setSelectedAppointment(null);
  };

  const handleCancelAppointmentFromModal = async (cancellationRecord) => {
    try {
      const token = localStorage.getItem('saqms_token');
      await fetch(`${BASE_URL}/appointments/${cancellationRecord.appointmentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // silently continue — update local state regardless
    }

    const updated = upcomingAppointments.filter(
      (apt) => apt.id !== cancellationRecord.appointmentId
    );
    setUpcomingAppointments(updated);
    localStorage.setItem('userAppointments', JSON.stringify(updated));
    setTotalAppointments(updated.length);

    localStorage.removeItem('userQueueData');
    setQueuePosition(null);
    setEstimatedWaitTime(null);
    setIsInQueue(false);

    setRescheduleModalOpen(false);
    setSelectedAppointment(null);
  };

  // ==========================================================================
  // SKELETON LOADER
  // ==========================================================================

  const SkeletonCard = () => (
    <div className="dashboard-card skeleton-card" aria-hidden="true">
      <div className="skeleton-line skeleton-title skeleton-shimmer"></div>
      <div className="skeleton-line skeleton-text skeleton-shimmer"></div>
      <div className="skeleton-line skeleton-text short skeleton-shimmer"></div>
      <div className="skeleton-line skeleton-text skeleton-shimmer"></div>
    </div>
  );

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div className="dashboard-container">

      {/* ===== DASHBOARD HEADER ===== */}
      <section className="dashboard-header">
        <div className="header-content">
          <h1>Welcome, {user?.name || 'Patient'}! </h1>
          <p>Manage your appointments and track your queue status in real time.</p>
        </div>
      </section>

      {/* ===== STATISTICS TILES ===== */}
      <section className="dashboard-stats">
        {/* Tile 1: Upcoming count */}
        <div className="stats-tile">
          <span className="stats-icon">📅</span>
          <span className="stats-number">
            {isLoading ? (
              <span className="stats-loading-dot">···</span>
            ) : totalAppointments}
          </span>
          <p className="stats-label">Upcoming Appointments</p>
        </div>

        {/* Tile 2: Completed count */}
        <div className="stats-tile">
          <span className="stats-icon">✅</span>
          <span className="stats-number">
            {isLoading ? (
              <span className="stats-loading-dot">···</span>
            ) : completedAppointments}
          </span>
          <p className="stats-label">Completed</p>
        </div>

        {/* Tile 3: REQ-7 — Queue Position */}
        <div className="stats-tile">
          <span className="stats-icon">⏱️</span>
          <span className="stats-number">
            {isLoading ? (
              <span className="stats-loading-dot">···</span>
            ) : isInQueue ? queuePosition : '—'}
          </span>
          <p className="stats-label">Queue Position</p>
        </div>

        {/* Tile 4: REQ-8 — Estimated Wait Time */}
        <div className="stats-tile">
          <span className="stats-icon">⏳</span>
          <span className="stats-number">
            {isLoading ? (
              <span className="stats-loading-dot">···</span>
            ) : isInQueue && estimatedWaitTime !== null
              ? `${estimatedWaitTime}m`
              : '—'}
          </span>
          <p className="stats-label">Est. Wait Time</p>
        </div>
      </section>

      {/* ===== DASHBOARD CONTENT GRID ===== */}
      <div className="dashboard-content">

        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>

            {/* ── MODULE 1: UPCOMING APPOINTMENTS ── */}
            <div className="dashboard-card">
              <h2>📅 Upcoming Appointments</h2>

              {upcomingAppointments.length > 0 ? (
                <div className="appointments-list">
                  {upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="appointment-item">
                      <div className="appointment-info">
                        <h3 className="appointment-doctor">
                          {appointment.doctorName}
                        </h3>
                        <div className="appointment-details">
                          <div className="appointment-details-item">
                            <span>📅 {formatDate(appointment.date)}</span>
                          </div>
                          <div className="appointment-details-item">
                            <span>⏰ {appointment.time}</span>
                          </div>
                          <div className="appointment-details-item">
                            <span className="status-badge confirmed">
                              {appointment.specialty}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="appointment-actions">
                        <button
                          className="manage-btn"
                          onClick={() => handleOpenRescheduleModal(appointment)}
                          title="Reschedule or cancel this appointment"
                        >
                          Manage Appointment
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  <h3 className="empty-state-title">No Upcoming Appointments</h3>
                  <p className="empty-state-desc">
                    You don't have any visits scheduled yet.
                  </p>
                  <p className="empty-state-hint">
                    Browse available doctors and book your first appointment in seconds.
                  </p>
                  <Link to="/doctors" className="nav-btn solid empty-state-cta">
                    🔍 Find a Doctor
                  </Link>
                </div>
              )}
            </div>

            {/* ── MODULE 2: QUEUE STATUS (REQ-7 & REQ-8) ── */}
            <div className="dashboard-card">
              <h2>📍 Your Queue Status</h2>

              {isInQueue && queuePosition !== null ? (
                <div className="queue-status-details">
                  <div className="queue-info-container">
                    <div className="queue-info-item">
                      <span className="queue-label">Your Position</span>
                      <span className="queue-value"># {queuePosition}</span>
                    </div>
                    <div className="queue-info-item">
                      <span className="queue-label">Estimated Wait</span>
                      <span className="queue-value">
                        {estimatedWaitTime !== null
                          ? `${estimatedWaitTime} min`
                          : 'Calculating…'}
                      </span>
                    </div>
                  </div>
                  <div className="queue-status-message">
                    <p>
                      🟢 You are in the queue. We'll notify you when it's your turn — hang tight!
                    </p>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">🏥</div>
                  <h3 className="empty-state-title">Not In Any Queue</h3>
                  <p className="empty-state-desc">
                    You are not currently waiting at any clinic.
                  </p>
                  <p className="empty-state-hint">
                    Your live position and estimated wait will appear here automatically once you join a clinic queue.
                  </p>
                </div>
              )}
            </div>

            {/* ── MODULE 3: MEDICAL RECORDS ── */}
            <div className="dashboard-card">
              <h2>📋 Medical Records</h2>
              <div className="empty-state">
                <div className="empty-state-icon">🗂️</div>
                <h3 className="empty-state-title">No Records Yet</h3>
                <p className="empty-state-desc">
                  Your medical records will appear here after your first consultation.
                </p>
                <p className="empty-state-hint">
                  Consultation summaries, prescriptions, and test results will be stored securely and accessible any time.
                </p>
              </div>
            </div>

            {/* ── MODULE 4: NOTIFICATIONS ── */}
            <div className="dashboard-card">
              <h2>🔔 Recent Notifications</h2>
              {notifications.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🔕</div>
                  <h3 className="empty-state-title">All Caught Up!</h3>
                  <p className="empty-state-desc">
                    You have no new notifications right now.
                  </p>
                  <p className="empty-state-hint">
                    Appointment confirmations, queue alerts, and reminders will appear here as events occur.
                  </p>
                </div>
              ) : (
                <ul className="list-group">
                  {notifications.map((n) => (
                    <li key={n.notificationId} className="list-group-item d-flex justify-content-between align-items-start">
                      <div>
                        <div>{n.message}</div>
                        <small className="text-muted">{n.sentAt}</small>
                      </div>
                      <span className="badge bg-primary ms-2">New</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

          </>
        )}
      </div>

      {/* ── REQ-6: Reschedule / Cancel Modal ── */}
      <RescheduleCancel
        appointment={selectedAppointment}
        isOpen={rescheduleModalOpen}
        onClose={() => {
          setRescheduleModalOpen(false);
          setSelectedAppointment(null);
        }}
        onReschedule={handleRescheduleAppointment}
        onCancel={handleCancelAppointmentFromModal}
      />
    </div>
  );
};

export default Dashboard;
