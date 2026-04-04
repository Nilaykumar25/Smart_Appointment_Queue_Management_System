/**
 * ========================================
 * DASHBOARD PAGE COMPONENT
 * Main user interface for authenticated patients
 * ========================================
 * Route: /dashboard (Protected — authenticated users only)
 * Redirects non-authenticated users to /login
 *
 * Modules rendered:
 *  1. Statistics Tiles  — quick KPIs (appointments, queue, amount due)
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
import RescheduleCancel from '../components/RescheduleCancel';
// REQ-14: Debounce utility prevents excessive queue-refresh calls during polling
import { debounce } from '../utils/debounce';

const Dashboard = () => {
  // ── Auth context ──────────────────────────────────────────────────────────
  const { user } = useAuth();

  // ── Appointment state ─────────────────────────────────────────────────────
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [totalAppointments, setTotalAppointments]       = useState(0);
  const [completedAppointments, setCompletedAppointments] = useState(0);
  const [amountDue, setAmountDue]                       = useState(0);

  // ── REQ-7: Queue Position / REQ-8: Estimated Wait Time ───────────────────
  const [queuePosition, setQueuePosition]       = useState(null);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState(null);
  const [isInQueue, setIsInQueue]               = useState(false);

  // ── REQ-6: Reschedule/Cancel modal state ─────────────────────────────────
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // ── Loading state — shows skeleton UI while localStorage data is read ─────
  const [isLoading, setIsLoading] = useState(true);

  // ── REQ-14: Ref holds the debounced refresh function across renders ───────
  const debouncedQueueRefreshRef = useRef(null);

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  /**
   * Effect: Initial data load
   * Uses a short timeout (800 ms) to simulate async data fetching and
   * ensure the skeleton loading state is visible before data populates.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      loadAppointments();
      loadQueueData();
      setIsLoading(false); // ← dismiss skeleton once data is ready
    }, 800);
    return () => clearTimeout(timer); // cleanup on unmount
  }, []);

  /**
   * Effect: Recalculate amount due whenever appointments change
   * Also runs on a 1-minute interval to catch appointments that expire
   * while the user is viewing the dashboard.
   */
  useEffect(() => {
    calculateAmountDue();
    const timer = setInterval(calculateAmountDue, 60_000);
    return () => clearInterval(timer);
  }, [upcomingAppointments]);

  /**
   * REQ-14: Effect — Debounced queue polling
   * Refreshes queue data every 5 seconds. The debounce (2 s) prevents
   * multiple rapid reads if the interval fires during a slow tick.
   *
   * Cleanup: clears the interval and nullifies the debounced ref on unmount
   * to prevent memory leaks.
   */
  useEffect(() => {
    // Build a debounced version of loadQueueData (2 s debounce delay)
    debouncedQueueRefreshRef.current = debounce(() => {
      try {
        loadQueueData();
      } catch (err) {
        console.error('[REQ-14] Error in debounced queue refresh:', err);
      }
    }, 2000);

    // Poll every 5 seconds; debounce absorbs burst triggers
    const pollInterval = setInterval(() => {
      debouncedQueueRefreshRef.current?.();
    }, 5000);

    return () => {
      clearInterval(pollInterval);
      debouncedQueueRefreshRef.current = null;
    };
  }, []);

  // ==========================================================================
  // DATA LOADERS
  // ==========================================================================

  /**
   * loadAppointments — reads persisted appointments from localStorage.
   * In production this would be replaced by an API call.
   */
  const loadAppointments = () => {
    try {
      const raw = localStorage.getItem('userAppointments');
      if (raw) {
        const appointments = JSON.parse(raw);
        setUpcomingAppointments(appointments);
        setTotalAppointments(appointments.length);
      }
    } catch (err) {
      console.error('Error loading appointments:', err);
    }
  };

  /**
   * loadQueueData — reads live queue info from localStorage.
   * REQ-7: sets queuePosition  |  REQ-8: sets estimatedWaitTime
   * REQ-14: called by the debounced polling interval above.
   */
  const loadQueueData = () => {
    try {
      const raw = localStorage.getItem('userQueueData');
      if (raw) {
        const queue = JSON.parse(raw);
        // REQ-7: current position in clinic queue
        setQueuePosition(queue.position ?? null);
        // REQ-8: estimated wait time in minutes
        setEstimatedWaitTime(queue.estimatedWaitTime ?? null);
        setIsInQueue(queue.position != null);
      } else {
        // No active queue — reset to idle state
        setQueuePosition(null);
        setEstimatedWaitTime(null);
        setIsInQueue(false);
      }
    } catch (err) {
      console.error('Error loading queue data:', err);
      setIsInQueue(false);
    }
  };

  // ==========================================================================
  // UTILITY FUNCTIONS
  // ==========================================================================

  /**
   * formatDate — converts a YYYY-MM-DD string into a human-readable date.
   * Appends T00:00:00 to avoid timezone-offset issues.
   */
  const formatDate = (dateString) =>
    new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      year:    'numeric',
      month:   'short',
      day:     'numeric',
    });

  /**
   * calculateAmountDue — sums consultation fees for appointments whose
   * date/time has already passed (i.e., the patient has been seen).
   */
  const calculateAmountDue = () => {
    const now   = new Date();
    let   total = 0;
    upcomingAppointments.forEach((apt) => {
      const apptTime = new Date(apt.date + 'T' + apt.time);
      if (apptTime < now && apt.fee) {
        total += parseFloat(apt.fee) || 0;
      }
    });
    setAmountDue(total);
  };

  // ==========================================================================
  // REQ-6: MODAL HANDLERS (Reschedule / Cancel)
  // ==========================================================================

  /**
   * handleOpenRescheduleModal — stores the target appointment and opens modal.
   * Triggered by the "Manage" button on each appointment card.
   */
  const handleOpenRescheduleModal = (appointment) => {
    setSelectedAppointment(appointment);
    setRescheduleModalOpen(true);
  };

  /**
   * handleRescheduleAppointment — replaces the old appointment object with
   * the rescheduled one and persists the updated list to localStorage.
   */
  const handleRescheduleAppointment = (rescheduled) => {
    const updated = upcomingAppointments.map((apt) =>
      apt.id === rescheduled.id ? rescheduled : apt
    );
    setUpcomingAppointments(updated);
    localStorage.setItem('userAppointments', JSON.stringify(updated));
    // Close modal and clear selection
    setRescheduleModalOpen(false);
    setSelectedAppointment(null);
  };

  /**
   * handleCancelAppointmentFromModal — removes the cancelled appointment
   * from state/localStorage and clears any active queue data for that booking.
   */
  const handleCancelAppointmentFromModal = (cancellationRecord) => {
    const updated = upcomingAppointments.filter(
      (apt) => apt.id !== cancellationRecord.appointmentId
    );
    setUpcomingAppointments(updated);
    localStorage.setItem('userAppointments', JSON.stringify(updated));
    setTotalAppointments(updated.length);

    // REQ-7 & REQ-8: Remove queue data when appointment is cancelled
    localStorage.removeItem('userQueueData');
    setQueuePosition(null);
    setEstimatedWaitTime(null);
    setIsInQueue(false);

    // Close modal and clear selection
    setRescheduleModalOpen(false);
    setSelectedAppointment(null);
  };

  // ==========================================================================
  // SKELETON LOADER COMPONENT
  // ==========================================================================

  /**
   * SkeletonCard — placeholder card shown while isLoading is true.
   * Uses CSS shimmer animation defined in index.css (.skeleton-shimmer).
   */
  const SkeletonCard = () => (
    <div className="dashboard-card skeleton-card" aria-hidden="true">
      {/* Fake card heading */}
      <div className="skeleton-line skeleton-title skeleton-shimmer"></div>
      {/* Fake content lines */}
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
      {/* Personalised greeting — name sourced from AuthContext */}
      <section className="dashboard-header">
        <div className="header-content">
          <h1>Welcome, {user?.name || 'Patient'}! </h1>
          <p>Manage your appointments and track your queue status in real time.</p>
        </div>
      </section>

      {/* ===== STATISTICS TILES ===== */}
      {/* Quick-glance KPIs — values show "..." while loading */}
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

        {/* Tile 4: Amount Due */}
        <div className="stats-tile">
          <span className="stats-icon">💰</span>
          <span className="stats-number">
            {isLoading ? (
              <span className="stats-loading-dot">···</span>
            ) : `$${amountDue.toFixed(2)}`}
          </span>
          <p className="stats-label">Amount Due</p>
        </div>
      </section>

      {/* ===== DASHBOARD CONTENT GRID ===== */}
      {/* Renders skeleton cards while loading, real modules after */}
      <div className="dashboard-content">

        {isLoading ? (
          /* ── LOADING STATE: four shimmer skeleton cards ── */
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          /* ── DATA LOADED: render all four modules ── */
          <>

            {/* ── MODULE 1: UPCOMING APPOINTMENTS ──────────────────────── */}
            {/* Lists all booked appointments with a manage action per row  */}
            <div className="dashboard-card">
              <h2>📅 Upcoming Appointments</h2>

              {upcomingAppointments.length > 0 ? (
                /* Appointment list — shown when at least one booking exists */
                <div className="appointments-list">
                  {upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="appointment-item">
                      {/* Left: doctor name + details */}
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
                            {/* Specialty displayed as a coloured status badge */}
                            <span className="status-badge confirmed">
                              {appointment.specialty}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: REQ-6 — opens Reschedule/Cancel modal */}
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
                /* ── EMPTY STATE: No appointments booked yet ─────────── */
                <div className="empty-state">
                  {/* Large illustrative emoji icon */}
                  <div className="empty-state-icon">📭</div>
                  <h3 className="empty-state-title">No Upcoming Appointments</h3>
                  <p className="empty-state-desc">
                    You don't have any visits scheduled yet.
                  </p>
                  <p className="empty-state-hint">
                    Browse available doctors and book your first appointment in
                    seconds.
                  </p>
                  {/* CTA: navigate to doctor search */}
                  <Link
                    to="/doctors"
                    className="nav-btn solid empty-state-cta"
                  >
                    🔍 Find a Doctor
                  </Link>
                </div>
              )}
            </div>

            {/* ── MODULE 2: QUEUE STATUS ────────────────────────────────── */}
            {/* REQ-7 & REQ-8: Live position + estimated wait time           */}
            <div className="dashboard-card">
              <h2>📍 Your Queue Status</h2>

              {isInQueue && queuePosition !== null ? (
                /* Active queue: show position and wait time */
                <div className="queue-status-details">
                  <div className="queue-info-container">
                    {/* REQ-7: Queue position number */}
                    <div className="queue-info-item">
                      <span className="queue-label">Your Position</span>
                      <span className="queue-value"># {queuePosition}</span>
                    </div>

                    {/* REQ-8: Estimated wait time in minutes */}
                    <div className="queue-info-item">
                      <span className="queue-label">Estimated Wait</span>
                      <span className="queue-value">
                        {estimatedWaitTime !== null
                          ? `${estimatedWaitTime} min`
                          : 'Calculating…'}
                      </span>
                    </div>
                  </div>

                  {/* Friendly status banner below the two KPI boxes */}
                  <div className="queue-status-message">
                    <p>
                      🟢 You are in the queue. We'll notify you when it's your
                      turn — hang tight!
                    </p>
                  </div>
                </div>
              ) : (
                /* ── EMPTY STATE: patient not currently waiting ─────── */
                <div className="empty-state">
                  <div className="empty-state-icon">🏥</div>
                  <h3 className="empty-state-title">Not In Any Queue</h3>
                  <p className="empty-state-desc">
                    You are not currently waiting at any clinic.
                  </p>
                  <p className="empty-state-hint">
                    Your live position and estimated wait will appear here
                    automatically once you join a clinic queue.
                  </p>
                </div>
              )}
            </div>

            {/* ── MODULE 3: MEDICAL RECORDS ─────────────────────────────── */}
            {/* Placeholder — will list visit summaries and prescriptions    */}
            <div className="dashboard-card">
              <h2>📋 Medical Records</h2>
              {/* ── EMPTY STATE: No records on file yet (future feature) ── */}
              <div className="empty-state">
                <div className="empty-state-icon">🗂️</div>
                <h3 className="empty-state-title">No Records Yet</h3>
                <p className="empty-state-desc">
                  Your medical records will appear here after your first
                  consultation.
                </p>
                <p className="empty-state-hint">
                  Consultation summaries, prescriptions, and test results will
                  be stored securely and accessible any time.
                </p>
              </div>
            </div>

            {/* ── MODULE 4: NOTIFICATIONS ───────────────────────────────── */}
            {/* Placeholder — will display alerts, reminders, and updates    */}
            <div className="dashboard-card">
              <h2>🔔 Recent Notifications</h2>
              {/* ── EMPTY STATE: Inbox is clear ────────────────────────── */}
              <div className="empty-state">
                <div className="empty-state-icon">🔕</div>
                <h3 className="empty-state-title">All Caught Up!</h3>
                <p className="empty-state-desc">
                  You have no new notifications right now.
                </p>
                <p className="empty-state-hint">
                  Appointment confirmations, queue alerts, and reminders will
                  appear here as events occur.
                </p>
              </div>
            </div>

          </>
        )}
      </div>

      {/* ── REQ-6: Reschedule / Cancel Modal ────────────────────────────── */}
      {/* Rendered at the bottom so it overlays the whole dashboard.         */}
      {/* Opens when user clicks "Manage Appointment" on any booking card.   */}
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
