import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  // If user is already logged in, redirect them immediately to their dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <h1 className="home-title">Your Health, Simplified</h1>
        <p className="home-subtitle">
          Book, manage, and track your medical appointments with ease. 
          Join the queue from home and save your valuable time avoiding the waiting room.
        </p>
        
        <div className="hero-actions">
          <Link to="/register" className="nav-btn solid hero-btn">
            Get Started Fast
          </Link>
          <Link to="/login" className="nav-btn outline hero-btn">
            Patient Login
          </Link>
        </div>
      </section>

      {/* Features Marketing Section */}
      <section className="features-section">
        <h2 className="section-title">Why Choose Our Portal?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📅</div>
            <h3>Easy Scheduling</h3>
            <p>Find your doctor and book available slots instantly from your device.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⏱️</div>
            <h3>Live Queue Tracking</h3>
            <p>Monitor real-time queue status so you only travel when it's your turn.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔔</div>
            <h3>Instant Alerts</h3>
            <p>Receive notifications for your appointment confirmations and delays.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
