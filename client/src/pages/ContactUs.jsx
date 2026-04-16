import { useState } from 'react';
import '../styles/ContactUs.css';

export default function ContactUs() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', email: '', subject: '', message: '' });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="contact-container">

      <section className="contact-hero">
        <h1>Get In Touch</h1>
        <p>Have a question or need support? Reach out to the SAQMS team — we're here to help.</p>
      </section>

      <div className="contact-content">

        <section className="contact-methods">
          <div className="method-card">
            <div className="method-icon">📧</div>
            <h3>Email</h3>
            <p><a href="mailto:riddhimatests@ce.du.ac.in">riddhimatests@ce.du.ac.in</a></p>
            <p><a href="mailto:nilaykumar2006@ce.du.ac.in">nilaykumar2006@ce.du.ac.in</a></p>
            <p><a href="mailto:shubhmittal628@ce.du.ac.in">shubhmittal628@ce.du.ac.in</a></p>
            <small>Response within 24 hours</small>
          </div>
          <div className="method-card">
            <div className="method-icon">📞</div>
            <h3>Phone</h3>
            <p><a href="tel:+919013290831">+91 90132 90831</a></p>
            <p><a href="tel:+918306541655">+91 83065 41655</a></p>
            <p><a href="tel:+919389588755">+91 93895 88755</a></p>
            <small>Mon–Fri: 9 AM – 6 PM IST</small>
          </div>
          <div className="method-card">
            <div className="method-icon">📍</div>
            <h3>Office</h3>
            <p>Maharisi Kanad Bhavan</p>
            <p>M6Q7+4MF, University Road</p>
            <p>Faculty of Science, University Enclave</p>
            <p>Delhi – 110007</p>
            <small>By appointment only</small>
          </div>
        </section>

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
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required placeholder="Your full name" />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required placeholder="your@email.com" />
            </div>
            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <input type="text" id="subject" name="subject" value={formData.subject} onChange={handleChange} required placeholder="How can we help?" />
            </div>
            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea id="message" name="message" value={formData.message} onChange={handleChange} required rows="6" placeholder="Tell us more about your inquiry..." />
            </div>
            <button type="submit" className="submit-btn">Send Message</button>
          </form>
        </section>
      </div>

      <section className="faq-preview">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h4>How do I book an appointment?</h4>
            <p>Register or log in, go to Find Doctors, pick a doctor and available slot, then confirm your booking.</p>
          </div>
          <div className="faq-item">
            <h4>Is my data secure?</h4>
            <p>Yes — all data is encrypted in transit and at rest, with role-based access control protecting your records.</p>
          </div>
          <div className="faq-item">
            <h4>Can I cancel my appointment?</h4>
            <p>Yes, you can cancel or reschedule up to 2 hours before the appointment from your dashboard.</p>
          </div>
          <div className="faq-item">
            <h4>How does the queue work?</h4>
            <p>After booking, you're added to the clinic queue. Your live position and estimated wait time update in real time on your dashboard.</p>
          </div>
        </div>
      </section>

    </div>
  );
}
