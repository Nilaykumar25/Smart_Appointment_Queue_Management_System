/**
 * ========================================
 * DASHBOARD PAGE COMPONENT
 * Main user interface for authenticated patients
 * ========================================
 * Route: /dashboard (Protected)
 * Access: Authenticated users only
 * Redirects: Non-authenticated users to /login
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  // Get current authenticated user from context
  const { user } = useAuth();

  return (
    <div className="dashboard-container">
      {/* ===== DASHBOARD HEADER ===== */}
      {/* Personalized greeting and introduction */}
      <div className="dashboard-header">
        <h1>Welcome, {user?.name || 'Patient'}! 👋</h1>
        <p>Manage your appointments and track your queue status in real time.</p>
      </div>
      
      {/* ===== DASHBOARD CONTENT GRID ===== */}
      {/* Main dashboard modules and information cards */}
      <div className="dashboard-content">
        
        {/* ===== MODULE 1: UPCOMING APPOINTMENTS ===== */}
        {/* Displays patient's scheduled appointments */}
        <div className="dashboard-card">
          <h2>📅 Upcoming Appointments</h2>
          <div className="empty-state">
            <p>You don't have any upcoming appointments right now.</p>
            <button className="nav-btn solid mt-4">Book an Appointment</button>
          </div>
        </div>

        {/* ===== MODULE 2: QUEUE STATUS ===== */}
        {/* Real-time tracking of patient's position in queue */}
        <div className="dashboard-card">
          <h2>📍 Your Queue Status</h2>
          <div className="empty-state">
            <p>You are not currently in any waiting queue.</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
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
            <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
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
            <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
              You'll receive updates about appointments, queue changes, and important alerts here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
