import React from 'react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome to your Dashboard, {user?.name || 'Patient'}</h1>
        <p>Here you can view your upcoming appointments and queue status.</p>
      </div>
      
      <div className="dashboard-content">
        {/* Appointments Module */}
        <div className="dashboard-card">
          <h2>Upcoming Appointments</h2>
          <div className="empty-state">
            <p>You have no upcoming appointments.</p>
            <button className="nav-btn solid mt-4">Book New Appointment</button>
          </div>
        </div>

        {/* Live Queue Module */}
        <div className="dashboard-card">
          <h2>Your Queue Status</h2>
          <div className="empty-state">
            <p>You are not currently in any waiting queue.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
