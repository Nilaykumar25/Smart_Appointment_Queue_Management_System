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

      {/* ===== ABOUT SECTION ===== */}
      {/* Company story and mission */}
      <section className="about-section">
        <div className="about-content">
          <h2>About Us</h2>
          <p>
            We're dedicated to transforming healthcare accessibility by eliminating unnecessary waits and bringing convenience to patient care. 
            Our Smart Appointment Queue Management System combines cutting-edge technology with user-friendly design to make healthcare more efficient.
          </p>
          <p>
            With our platform, healthcare providers can manage their resources better, and patients can spend their time more productively rather than waiting in clinics.
          </p>
          
          {/* Statistics */}
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">10K+</span>
              <span className="stat-label">Active Patients</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">500+</span>
              <span className="stat-label">Partner Doctors</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">50K+</span>
              <span className="stat-label">Appointments Managed</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">98%</span>
              <span className="stat-label">Satisfaction Rate</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CONTACT SECTION ===== */}
      {/* Contact information and support */}
      <section className="contact-section">
        <div className="contact-content">
          <h2 className="section-title">Contact Us</h2>
          
          <div className="contact-grid">
            {/* Email Contact */}
            <div className="contact-item">
              <div className="contact-icon">📧</div>
              <h3>Email</h3>
              <p>
                <a href="mailto:support@patientportal.com">support@patientportal.com</a>
              </p>
            </div>

            {/* Phone Contact */}
            <div className="contact-item">
              <div className="contact-icon">📞</div>
              <h3>Phone</h3>
              <p>
                <a href="tel:+1-800-PATIENTS">+1 (800) 728-4837</a>
              </p>
            </div>

            {/* Location Contact */}
            <div className="contact-item">
              <div className="contact-icon">📍</div>
              <h3>Office</h3>
              <p>
                Healthcare Building, 123 Medical Lane<br />
                New York, NY 10001
              </p>
            </div>
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
