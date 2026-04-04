import { useState } from 'react';
import '../styles/ContactUs.css';

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, send to backend
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', email: '', subject: '', message: '' });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="contact-container">
      {/* Hero */}
      <section className="contact-hero">
        <h1>Get In Touch</h1>
        <p>We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
      </section>

      <div className="contact-content">
        {/* Contact Methods - Implemented Features Only */}
        <section className="contact-methods">
          <div className="method-card">
            <div className="method-icon">📧</div>
            <h3>Email</h3>
            <p><a href="mailto:support@patientportal.com">support@patientportal.com</a></p>
            <small>Response time: Within 24 hours</small>
          </div>
          <div className="method-card">
            <div className="method-icon">📞</div>
            <h3>Phone</h3>
            <p><a href="tel:+1-800-728-4837">+1 (800) 728-4837</a></p>
            <small>Mon-Fri: 9 AM - 6 PM EST</small>
          </div>
          <div className="method-card">
            <div className="method-icon">📍</div>
            <h3>Office</h3>
            <p>Healthcare Building<br/>123 Medical Lane<br/>New York, NY 10001</p>
            <small>By appointment only</small>
          </div>
        </section>

        {/* Contact Form */}
        <section className="contact-form-section">
          <h2>Send us a Message</h2>
          {submitted && (
            <div className="success-message">
              ✓ Thank you! We've received your message and will get back to you soon.
            </div>
          )}
          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="John Doe"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="john@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                placeholder="How can we help?"
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="6"
                placeholder="Tell us more about your inquiry..."
              ></textarea>
            </div>

            <button type="submit" className="submit-btn">Send Message</button>
          </form>
        </section>
      </div>

      {/* FAQ Section */}
      <section className="faq-preview">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h4>How do I book an appointment?</h4>
            <p>Create an account and use the scheduling system to find available time slots from our network of healthcare providers.</p>
          </div>
          <div className="faq-item">
            <h4>Is my data secure?</h4>
            <p>Yes, we use industry-leading encryption and comply with all HIPAA requirements to protect your health information.</p>
          </div>
          <div className="faq-item">
            <h4>Can I cancel my appointment?</h4>
            <p>Yes, you can cancel or reschedule appointments up to 24 hours before the appointment time.</p>
          </div>
          <div className="faq-item">
            <h4>How do I reset my password?</h4>
            <p>Click the "Forgot Password" link on the login page and follow the instructions sent to your email.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
