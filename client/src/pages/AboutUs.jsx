import { Link } from 'react-router-dom';
import '../styles/AboutUs.css';

export default function AboutUs() {
  return (
    <div className="about-container">

      <section className="about-hero">
        <div className="hero-content">
          <h1 className="hero-title">About SAQMS</h1>
          <p className="hero-subtitle">Smart Appointment & Queue Management System — built for modern clinics and patients who value their time.</p>
        </div>
      </section>

      <section className="mission-vision">
        <div className="container">
          <div className="mission-card">
            <div className="icon-circle">🎯</div>
            <h2>Our Mission</h2>
            <p>To eliminate the frustration of long clinic waits by giving patients real-time visibility into their queue position and empowering staff with intelligent scheduling tools.</p>
          </div>
          <div className="mission-card">
            <div className="icon-circle">👁️</div>
            <h2>Our Vision</h2>
            <p>A healthcare system where every patient is seen on time, every doctor's schedule is optimised, and every clinic runs at peak efficiency — powered by smart technology.</p>
          </div>
        </div>
      </section>

      <section className="values-section">
        <div className="container">
          <h2 className="section-heading">Our Core Values</h2>
          <div className="values-grid">
            <div className="value-card">
              <span className="value-icon">💡</span>
              <h3>Innovation</h3>
              <p>Applying modern technology to solve real healthcare challenges</p>
            </div>
            <div className="value-card">
              <span className="value-icon">❤️</span>
              <h3>Patient First</h3>
              <p>Every feature is designed with the patient experience in mind</p>
            </div>
            <div className="value-card">
              <span className="value-icon">🤝</span>
              <h3>Collaboration</h3>
              <p>Built in partnership with healthcare providers and students</p>
            </div>
            <div className="value-card">
              <span className="value-icon">🔒</span>
              <h3>Security</h3>
              <p>End-to-end encryption and strict data privacy standards</p>
            </div>
          </div>
        </div>
      </section>

      <section className="team-section">
        <div className="container">
          <h2 className="section-heading">Why SAQMS?</h2>
          <div className="benefits-grid">
            <div className="benefit-item">
              <h3>Real-Time Queue Tracking</h3>
              <p>Patients see their live position and estimated wait time — no more guessing at the reception desk.</p>
            </div>
            <div className="benefit-item">
              <h3>Instant Booking</h3>
              <p>Book, reschedule, or cancel appointments in seconds from any device.</p>
            </div>
            <div className="benefit-item">
              <h3>Staff Dashboard</h3>
              <p>Clinic staff manage the queue, mark arrivals, and broadcast alerts from a single clean interface.</p>
            </div>
            <div className="benefit-item">
              <h3>Secure & Compliant</h3>
              <p>Patient data is encrypted at rest and in transit, with role-based access control throughout.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat">
              <h3>8+</h3>
              <p>Specialist Doctors</p>
            </div>
            <div className="stat">
              <h3>560+</h3>
              <p>Slots Available Weekly</p>
            </div>
            <div className="stat">
              <h3>Real-Time</h3>
              <p>Queue Updates</p>
            </div>
            <div className="stat">
              <h3>24/7</h3>
              <p>Online Booking</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-cta">
        <h2>Ready to Skip the Wait?</h2>
        <p>Join SAQMS today and take control of your healthcare appointments.</p>
        <Link to="/register" className="cta-button">Get Started</Link>
      </section>

    </div>
  );
}
