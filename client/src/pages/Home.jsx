/**
 * ========================================
 * HOME PAGE COMPONENT
 * Landing page for unauthenticated users
 * REQ-4: Enhanced patient UI for doctor search navigation
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
        <div className="hero-content">
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

      {/* ===== HOW IT WORKS SECTION ===== */}
      {/* Step-by-step guide for new users */}
      <section className="how-it-works">
        <h2 className="section-title">How It Works</h2>
        
        <div className="steps-grid">
          {/* Step 1 */}
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Create Account</h3>
            <p>Sign up quickly with your email and personal information. Secure and verified profile setup takes less than 2 minutes.</p>
          </div>

          {/* Step 2 */}
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Book Appointment</h3>
            <p>Browse available doctors and time slots. Choose the one that best fits your schedule with just a few clicks.</p>
          </div>

          {/* Step 3 */}
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Join Queue</h3>
            <p>Check in for your appointment and join the virtual queue. Receive real-time updates on your position.</p>
          </div>

          {/* Step 4 */}
          <div className="step-card">
            <div className="step-number">4</div>
            <h3>Visit Doctor</h3>
            <p>Visit the clinic only when notified. No more long waits—come in when it's your turn, improving your experience.</p>
          </div>
        </div>
      </section>

      {/* ===== TRUSTED HEALTHCARE PROVIDERS SECTION ===== */}
      {/* Showcase partnership and trust */}
      <section className="providers-section">
        <h2 className="section-title">Trusted by Healthcare Providers Worldwide</h2>
        <div className="providers-content">
          <div className="providers-stats">
            <div className="stat-card">
              <div className="stat-icon">👨‍⚕️</div>
              <h3>500+ Doctors</h3>
              <p>Professional healthcare providers partnering with us to deliver better patient care</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🏥</div>
              <h3>100+ Clinics</h3>
              <p>Modern medical facilities integrating our system for efficient appointment management</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <h3>50K+ Patients</h3>
              <p>Satisfied patients who've revolutionized their healthcare experience</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <h3>4.9 Rating</h3>
              <p>Consistently rated as the most reliable appointment management system</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PREMIUM FEATURES SECTION ===== */}
      {/* Advanced capabilities and benefits */}
      <section className="premium-features-section">
        <h2 className="section-title">Premium Features Built for You</h2>
        <div className="features-showcase">
          <div className="feature-showcase-card">
            <div className="showcase-icon">📱</div>
            <h3>Mobile-First Design</h3>
            <p>Access your appointments and queue status anytime, anywhere with our seamless mobile application.</p>
          </div>
          <div className="feature-showcase-card">
            <div className="showcase-icon">🔐</div>
            <h3>Secure & Private</h3>
            <p>Your health data is protected with enterprise-grade encryption and HIPAA compliance standards.</p>
          </div>
          <div className="feature-showcase-card">
            <div className="showcase-icon">⚡</div>
            <h3>Lightning Fast</h3>
            <p>Experience instant booking confirmations and real-time queue updates with zero delays.</p>
          </div>
          <div className="feature-showcase-card">
            <div className="showcase-icon">🌍</div>
            <h3>Available 24/7</h3>
            <p>Book appointments and manage your health schedule anytime, day or night, from anywhere in the world.</p>
          </div>
        </div>
      </section>

      {/* ===== CALL-TO-ACTION SECTION ===== */}
      {/* Final conversion opportunity */}
      <section className="cta-section">
        <h2>Ready to Transform Your Healthcare Experience?</h2>
        <p>Join thousands of patients who have already simplified their appointment management.</p>
        <Link to="/register" className="cta-button">Start Your Journey Today</Link>
      </section>
    </div>
  );
};

export default Home;
