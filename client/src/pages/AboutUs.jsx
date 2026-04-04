import { Link } from 'react-router-dom';
import '../styles/AboutUs.css';

export default function AboutUs() {
  return (
    <div className="about-container">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="hero-content">
          <h1 className="hero-title">About Patient Portal</h1>
          <p className="hero-subtitle">Revolutionizing Healthcare Management Through Innovation</p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="mission-vision">
        <div className="container">
          <div className="mission-card">
            <div className="icon-circle">🎯</div>
            <h2>Our Mission</h2>
            <p>We are committed to simplifying healthcare by providing patients with intelligent appointment scheduling and queue management tools that reduce wait times and improve the overall patient experience.</p>
          </div>
          <div className="mission-card">
            <div className="icon-circle">👁️</div>
            <h2>Our Vision</h2>
            <p>To create a world where every patient receives timely, efficient care through technology that bridges the gap between patients and healthcare providers.</p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="values-section">
        <div className="container">
          <h2 className="section-heading">Our Core Values</h2>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon">💡</div>
              <h3>Innovation</h3>
              <p>Using cutting-edge technology to solve real healthcare challenges</p>
            </div>
            <div className="value-card">
              <div className="value-icon">❤️</div>
              <h3>Patient Care</h3>
              <p>Putting patient well-being at the center of every decision</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🤝</div>
              <h3>Collaboration</h3>
              <p>Building strong partnerships with healthcare providers and patients</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🔒</div>
              <h3>Trust & Security</h3>
              <p>Ensuring data privacy and secure healthcare information management</p>
            </div>
          </div>
        </div>
      </section>

      {/* Team & Impact */}
      <section className="team-section">
        <div className="container">
          <h2 className="section-heading">Why Choose Us?</h2>
          <div className="benefits-grid">
            <div className="benefit-item">
              <h3>Proven Results</h3>
              <p>Our platform has helped healthcare facilities reduce appointment wait times by up to 40%</p>
            </div>
            <div className="benefit-item">
              <h3>24/7 Support</h3>
              <p>Dedicated customer support team available round the clock to assist you</p>
            </div>
            <div className="benefit-item">
              <h3>Easy Integration</h3>
              <p>Seamlessly integrates with existing healthcare management systems</p>
            </div>
            <div className="benefit-item">
              <h3>Mobile Ready</h3>
              <p>Access your appointments anytime, anywhere with our mobile interface</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat">
              <h3>500+</h3>
              <p>Healthcare Facilities</p>
            </div>
            <div className="stat">
              <h3>2M+</h3>
              <p>Active Users</p>
            </div>
            <div className="stat">
              <h3>50K+</h3>
              <p>Daily Appointments</p>
            </div>
            <div className="stat">
              <h3>99.9%</h3>
              <p>Uptime Guarantee</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="about-cta">
        <h2>Ready to Transform Your Healthcare Experience?</h2>
        <p>Join thousands of patients and healthcare providers using Patient Portal today</p>
        <Link to="/" className="cta-button">Get Started Now</Link>
      </section>
    </div>
  );
}
