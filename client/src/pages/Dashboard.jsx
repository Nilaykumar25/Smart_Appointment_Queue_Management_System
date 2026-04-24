/**
 * ========================================
 * DASHBOARD PAGE COMPONENT
 * Main user interface for authenticated patients
 * ========================================
 * Route: /dashboard (Protected — authenticated users only)
 * Redirects non-authenticated users to /login
 *
 * DATABASE FIRST - All data fetched directly from database
 * No cache dependencies - database is primary source
 */

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isTokenExpired } from '../services/auth';
import { apiCall } from '../services/api';
import RescheduleCancel from '../components/RescheduleCancel';
import { debounce } from '../utils/debounce';

const Dashboard = () => {
  const { user } = useAuth();

  // State management
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [queuePosition, setQueuePosition] = useState(null);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState(null);
  const [isInQueue, setIsInQueue] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const debouncedQueueRefreshRef = useRef(null);

  // Effects
  useEffect(() => {
    if (isTokenExpired()) {
      console.log('[Dashboard] Token is expired, user may need to log in again');
    }
    
    const timer = setTimeout(() => {
      loadAppointments();
      loadQueueData();
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    debouncedQueueRefreshRef.current = debounce(() => {
      try {
        loadQueueData();
      } catch (err) {
        console.error('[REQ-14] Error in debounced queue refresh:', err);
      }
    }, 1000);

    const pollInterval = setInterval(() => {
      debouncedQueueRefreshRef.current?.();
    }, 3000);

    return () => {
      clearInterval(pollInterval);
      debouncedQueueRefreshRef.current = null;
    };
  }, []);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const token = localStorage.getItem('saqms_token');
        if (!token) return;
        
        const data = await apiCall('/notifications/my');
        setNotifications(data.notifications || []);
      } catch (error) {
        console.error('[Notifications] Fetch error:', error);
      }
    }
    fetchNotifications();
  }, []);

  // Data loaders - DATABASE FIRST
  const loadAppointments = async () => {
    try {
      const userId = user?.userId;
      if (!userId) {
        setUpcomingAppointments([]);
        setTotalAppointments(0);
        return;
      }

      const appointments = await apiCall(`/appointments/user/${userId}`);
      const now = new Date();
      const futureAppointments = (appointments || [])
        .filter(apt => new Date(`${apt.date}T${apt.time}`) > now)
        .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

      setUpcomingAppointments(futureAppointments);
      setTotalAppointments(futureAppointments.length);

      if (futureAppointments.length > 0) {
        loadQueueDataForAppointment(futureAppointments[0]);
      }
    } catch (err) {
      console.error('Error loading appointments:', err);
      setUpcomingAppointments([]);
      setTotalAppointments(0);
    }
  };

  const loadQueueDataForAppointment = async (appointment) => {
    try {
      if (!appointment?.appointment_id || !user?.userId) {
        setIsInQueue(false);
        return;
      }

      try {
        const queueData = await apiCall(`/appointments/queue/${user.userId}`);
        setQueuePosition(queueData.position ?? null);
        setEstimatedWaitTime(queueData.estimated_wait_time ?? null);
        setIsInQueue(queueData.position != null);
      } catch (err) {
        if (err.status === 404) {
          setQueuePosition(null);
          setEstimatedWaitTime(null);
          setIsInQueue(false);
        } else {
          setIsInQueue(false);
        }
      }
    } catch (err) {
      console.error('Error loading queue data for appointment:', err);
      setIsInQueue(false);
    }
  };

  const loadQueueData = async () => {
    try {
      const userId = user?.userId;
      if (!userId) {
        setIsInQueue(false);
        return;
      }

      try {
        const queueData = await apiCall(`/appointments/queue/${userId}`);
        setQueuePosition(queueData.position ?? null);
        setEstimatedWaitTime(queueData.estimated_wait_time ?? null);
        setIsInQueue(queueData.position != null);
      } catch (error) {
        if (error.status === 404) {
          setQueuePosition(null);
          setEstimatedWaitTime(null);
          setIsInQueue(false);
        } else {
          setIsInQueue(false);
        }
      }
    } catch (err) {
      console.error('Error loading queue data:', err);
      setIsInQueue(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await loadAppointments();
      await loadQueueData();
    } finally {
      setIsLoading(false);
    }
  };

  // Utility functions
  const formatDate = (dateString) =>
    new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  // Modal handlers
  const handleOpenRescheduleModal = (appointment) => {
    setSelectedAppointment(appointment);
    setRescheduleModalOpen(true);
  };

  const handleRescheduleAppointment = async () => {
    await loadAppointments();
    setRescheduleModalOpen(false);
    setSelectedAppointment(null);
  };

  const handleCancelAppointmentFromModal = async (cancellationRecord) => {
    try {
      await apiCall(`/appointments/${cancellationRecord.appointmentId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }

    await loadAppointments();
    await loadQueueData();

    setRescheduleModalOpen(false);
    setSelectedAppointment(null);
  };

  // Skeleton loader
  const SkeletonCard = () => (
    <div className="dashboard-card skeleton-card" aria-hidden="true">
      <div className="skeleton-line skeleton-title skeleton-shimmer"></div>
      <div className="skeleton-line skeleton-text skeleton-shimmer"></div>
      <div className="skeleton-line skeleton-text short skeleton-shimmer"></div>
      <div className="skeleton-line skeleton-text skeleton-shimmer"></div>
    </div>
  );

  return (
    <div className="dashboard-container">
      {/* Dashboard Header */}
      <section className="dashboard-header">
        <div className="header-content">
          <h1>Welcome, {user?.name || 'Patient'}!</h1>
          <p>Manage your appointments and track your queue status in real time.</p>
        </div>
      </section>

      {/* Statistics Tiles */}
      <section className="dashboard-stats">
        <div className="stats-tile">
          <span className="stats-icon">📅</span>
          <span className="stats-number">
            {isLoading ? <span className="stats-loading-dot">···</span> : totalAppointments}
          </span>
          <p className="stats-label">Upcoming Appointments</p>
        </div>

        <div className="stats-tile">
          <span className="stats-icon">✅</span>
          <span className="stats-number">
            {isLoading ? <span className="stats-loading-dot">···</span> : 0}
          </span>
          <p className="stats-label">Completed</p>
        </div>

        <div className="stats-tile">
          <span className="stats-icon">⏱️</span>
          <span className="stats-number">
            {isLoading ? <span className="stats-loading-dot">···</span> : isInQueue ? queuePosition : '—'}
          </span>
          <p className="stats-label">Queue Position</p>
        </div>

        <div className="stats-tile">
          <span className="stats-icon">⏳</span>
          <span className="stats-number">
            {isLoading ? <span className="stats-loading-dot">···</span> : 
             isInQueue && estimatedWaitTime !== null ? `${estimatedWaitTime}m` : '—'}
          </span>
          <p className="stats-label">Est. Wait Time</p>
        </div>
      </section>

      {/* Dashboard Content */}
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
            {/* Upcoming Appointments */}
            <div className="dashboard-card">
              <h2>📅 Upcoming Appointments</h2>

              {upcomingAppointments.length > 0 ? (
                <div className="appointments-list">
                  {upcomingAppointments.map((appointment) => (
                    <div key={appointment.id} className="appointment-item">
                      <div className="appointment-info">
                        <h3 className="appointment-doctor">{appointment.doctorName}</h3>
                        <div className="appointment-details">
                          <div className="appointment-details-item">
                            <span>📅 {formatDate(appointment.date)}</span>
                          </div>
                          <div className="appointment-details-item">
                            <span>⏰ {appointment.time}</span>
                          </div>
                          <div className="appointment-details-item">
                            <span className="status-badge confirmed">{appointment.specialty}</span>
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
                    {isInQueue ? 
                      "You're in the queue but we can't find your appointment details." :
                      "You don't have any visits scheduled yet."
                    }
                  </p>
                  {isInQueue ? (
                    <div className="empty-state-actions">
                      <p className="empty-state-hint">
                        You're in the queue but appointments aren't loading.
                      </p>
                      <button 
                        className="nav-btn solid empty-state-cta"
                        onClick={handleRefresh}
                        disabled={isLoading}
                      >
                        🔄 Refresh
                      </button>
                    </div>
                  ) : (
                    <div className="empty-state-actions">
                      <p className="empty-state-hint">
                        Browse available doctors and book your first appointment in seconds.
                      </p>
                      <Link to="/doctors" className="nav-btn solid empty-state-cta">
                        🔍 Find a Doctor
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Queue Status */}
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
                        {estimatedWaitTime !== null ? `${estimatedWaitTime} min` : 'Calculating…'}
                      </span>
                    </div>
                  </div>
                  <div className="queue-status-message">
                    <p>🟢 You are in the queue. We'll notify you of any position changes — hang tight!</p>
                    <small className="text-muted">
                      Queue positions update automatically. Check your notifications for any changes.
                    </small>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">🏥</div>
                  <h3 className="empty-state-title">Not In Any Queue</h3>
                  <p className="empty-state-desc">You are not currently waiting at any clinic.</p>
                  <p className="empty-state-hint">
                    Your live position and estimated wait will appear here automatically once you join a clinic queue.
                  </p>
                </div>
              )}
            </div>

            {/* Medical Records */}
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

            {/* Notifications */}
            <div className="dashboard-card">
              <h2>🔔 Recent Notifications</h2>
              {notifications.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🔕</div>
                  <h3 className="empty-state-title">All Caught Up!</h3>
                  <p className="empty-state-desc">You have no new notifications right now.</p>
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

      {/* Reschedule/Cancel Modal */}
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