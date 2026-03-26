/**
 * ========================================
 * HOME PAGE COMPONENT
 * Landing page for unauthenticated users
 * ========================================
 * Route: / (root)
 * Access: Public (redirects authenticated users to dashboard)
 */

import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  // Get current user from authentication context
  const { user } = useAuth();

  // Redirect authenticated users to dashboard
  // Prevents authenticated users from seeing landing page
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="home-container">
      {/* ===== HERO SECTION ===== */}
      {/* Main value proposition and call-to-action buttons */}
      <section className="hero-section">
        <h1 className="home-title">Your Health, Simplified</h1>
        <p className="home-subtitle">
          Book, manage, and track your medical appointments effortlessly. 
          Skip the waiting room, join the queue from home, and visit only when it's your turn.
        </p>
        
        {/* Primary action buttons */}
        <div className="hero-actions">
          {/* CTA: Register new patient */}
          <Link to="/register" className="nav-btn solid hero-btn">
            Get Started Now
          </Link>
          
          {/* Secondary CTA: Existing patient login */}
          <Link to="/login" className="nav-btn outline hero-btn">
            Sign In
          </Link>
        </div>
      </section>

      {/* ===== FEATURES MARKETING SECTION ===== */}
      {/* Highlights key benefits to encourage signup */}
      <section className="features-section">
        <h2 className="section-title">Why Patients Love Us</h2>
        
        <div className="features-grid">
          {/* Feature 1: Easy Scheduling */}
          <div className="feature-card">
            <div className="feature-icon">📅</div>
            <h3>Easy Scheduling</h3>
            <p>Select your preferred doctor, view available time slots, and book appointments instantly from your phone or computer anytime, anywhere.</p>
          </div>

          {/* Feature 2: Live Queue Tracking */}
          <div className="feature-card">
            <div className="feature-icon">📍</div>
            <h3>Live Queue Tracking</h3>
            <p>Monitor real-time queue status and receive your queue position. Visit the clinic only when it's almost your turn—no more wasted time waiting.</p>
          </div>

          {/* Feature 3: Smart Notifications */}
          <div className="feature-card">
            <div className="feature-icon">🔔</div>
            <h3>Smart Notifications</h3>
            <p>Get instant alerts for appointment confirmations, reminders, delays, and when you're next in the queue. Stay informed every step of the way.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
