/**
 * ========================================
 * DASHBOARD PAGE COMPONENT
 * Main user interface for authenticated patients
 * ========================================
 * Route: /dashboard (Protected)
 * Access: Authenticated users only
 * Redirects: Non-authenticated users to /login
 * 
 * Features:
 * - Upcoming appointments display
 * - Queue status tracking
 * - Medical records access
 * - Notifications center
 * - Statistics tiles
 * - Link to book new appointments
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  // Get current authenticated user from context
  const { user } = useAuth();

  // State management for appointments and statistics
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [completedAppointments, setCompletedAppointments] = useState(0);

  // Effect: Load appointments from localStorage on component mount
  useEffect(() => {
    loadAppointments();
  }, []);

  // Function to load appointments from localStorage
  const loadAppointments = () => {
    try {
      const savedAppointments = localStorage.getItem('userAppointments');
      if (savedAppointments) {
        const appointments = JSON.parse(savedAppointments);
        setUpcomingAppointments(appointments);
        setTotalAppointments(appointments.length);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  };

  // Function to format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Function to cancel appointment
  const cancelAppointment = (appointmentId) => {
    const updated = upcomingAppointments.filter(apt => apt.id !== appointmentId);
    setUpcomingAppointments(updated);
    localStorage.setItem('userAppointments', JSON.stringify(updated));
    setTotalAppointments(updated.length);
  };

  return (
    <div className="dashboard-container">
      {/* ===== DASHBOARD HEADER ===== */}
      {/* Personalized greeting and introduction */}
      <section className="dashboard-header">
        <div className="header-content">
          <h1>Welcome, {user?.name || 'Patient'}! </h1>
          <p>Manage your appointments and track your queue status in real time.</p>
        </div>
      </section>
      
      {/* ===== STATISTICS TILES ===== */}
      {/* Quick stats about appointments and health */}
      <section className="dashboard-stats">
        <div className="stats-tile">
          <span className="stats-icon">📅</span>
          <span className="stats-number">{totalAppointments}</span>
          <p className="stats-label">Upcoming Appointments</p>
        </div>
        <div className="stats-tile">
          <span className="stats-icon">✅</span>
          <span className="stats-number">{completedAppointments}</span>
          <p className="stats-label">Completed</p>
        </div>
        <div className="stats-tile">
          <span className="stats-icon">⏱️</span>
          <span className="stats-number">0</span>
          <p className="stats-label">Queue Position</p>
        </div>
        <div className="stats-tile">
          <span className="stats-icon">💰</span>
          <span className="stats-number">$0</span>
          <p className="stats-label">Amount Due</p>
        </div>
      </section>
      
      {/* ===== DASHBOARD CONTENT GRID ===== */}
      {/* Main dashboard modules and information cards */}
      <div className="dashboard-content">
        
        {/* ===== MODULE 1: UPCOMING APPOINTMENTS ===== */}
        {/* Displays patient's scheduled appointments - Linked to doctor search */}
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
                      className="cancel-btn"
                      onClick={() => cancelAppointment(appointment.id)}
                    >
                      Cancel Appointment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-appointments">
              <h3>No Upcoming Appointments</h3>
              <p>You don't have any upcoming appointments scheduled.</p>
              <Link to="/doctors" className="nav-btn solid" style={{ marginTop: '1.5rem', display: 'inline-block' }}>
                Book an Appointment
              </Link>
            </div>
          )}
        </div>

        {/* ===== MODULE 2: QUEUE STATUS ===== */}
        {/* Real-time tracking of patient's position in queue */}
        <div className="dashboard-card">
          <h2>📍 Your Queue Status</h2>
          <div className="empty-state">
            <p>You are not currently in any waiting queue.</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Your queue position will appear here once you join a queue at a clinic.
            </p>
          </div>
        </div>

        {/* ===== MODULE 3: MEDICAL RECORDS ===== */}
        {/* Access to patient's medical history and documents */}
        <div className="dashboard-card">
          <h2>📋 Medical Records</h2>
          <div className="empty-state">
            <p>Your medical records and past appointments will be displayed here.</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Access your consultation summaries and prescriptions securely in one place.
            </p>
          </div>
        </div>

        {/* ===== MODULE 4: NOTIFICATIONS ===== */}
        {/* Important alerts and reminders */}
        <div className="dashboard-card">
          <h2>🔔 Recent Notifications</h2>
          <div className="empty-state">
            <p>You don't have any new notifications.</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              You'll receive updates about appointments, queue changes, and important alerts here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
