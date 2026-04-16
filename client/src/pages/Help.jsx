import { useState } from 'react';
import '../styles/Help.css';

export default function Help() {
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const faqs = [
    { id: 1, question: 'How do I create an account?', answer: 'Click Register on the home page, fill in your name, email and password, and you\'re in. The whole process takes under a minute.' },
    { id: 2, question: 'How do I book an appointment?', answer: 'Log in, click Find Doctors in the navbar, choose a doctor, pick a date and available time slot, then confirm on the next screen.' },
    { id: 3, question: 'Can I reschedule or cancel?', answer: 'Yes — open your Dashboard, click Manage Appointment on any booking, and choose Reschedule or Cancel. You must do this at least 2 hours before the appointment.' },
    { id: 4, question: 'How does the queue system work?', answer: 'When you book, you\'re automatically added to the clinic queue. Your Dashboard shows your live position and estimated wait time, refreshed every 10 seconds.' },
    { id: 5, question: 'What notifications will I receive?', answer: 'You\'ll receive in-app notifications for booking confirmations, reschedules, cancellations, and broadcast alerts from clinic staff.' },
    { id: 6, question: 'Is my personal data secure?', answer: 'Yes. All data is encrypted in transit (TLS) and at rest. Role-based access control ensures only authorised staff can view patient records.' },
    { id: 7, question: 'How do I access the staff or admin portal?', answer: 'Go to /staff-login. Staff and admin accounts are created by the system administrator — patients cannot self-register as staff.' },
    { id: 8, question: 'Who do I contact for technical issues?', answer: 'Email nilaykumar2006@ce.du.ac.in or call +91 90132 90831 during business hours (Mon–Fri, 9 AM–6 PM IST).' },
  ];

  const toggleFAQ = (id) => setExpandedFAQ(expandedFAQ === id ? null : id);

  return (
    <div className="help-container">

      <section className="help-hero">
        <h1>Help & Support</h1>
        <p>Everything you need to get the most out of SAQMS — guides, FAQs, and direct support.</p>
      </section>

      <section className="quick-nav">
        <div className="container">
          <h2>Quick Navigation</h2>
          <div className="nav-cards">
            <a href="#getting-started" className="nav-card">
              <div className="card-icon">🚀</div>
              <h3>Getting Started</h3>
              <p>New here? Start with the basics</p>
            </a>
            <a href="#faqs" className="nav-card">
              <div className="card-icon">❓</div>
              <h3>FAQs</h3>
              <p>Answers to common questions</p>
            </a>
            <a href="#support" className="nav-card">
              <div className="card-icon">💬</div>
              <h3>Contact Support</h3>
              <p>Reach the SAQMS team directly</p>
            </a>
          </div>
        </div>
      </section>

      <section className="getting-started" id="getting-started">
        <div className="container">
          <h2>Getting Started</h2>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Create Account</h3>
              <p>Register with your email and a secure password. Takes less than a minute.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Find a Doctor</h3>
              <p>Browse specialists by name or specialty and view their available slots.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Book a Slot</h3>
              <p>Pick your preferred date and time, confirm the booking details.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-number">4</div>
              <h3>Track Your Queue</h3>
              <p>Watch your live queue position and estimated wait time on your dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="faqs-section" id="faqs">
        <div className="container">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-list">
            {faqs.map((faq) => (
              <div key={faq.id} className="faq-item">
                <button
                  className={`faq-question ${expandedFAQ === faq.id ? 'active' : ''}`}
                  onClick={() => toggleFAQ(faq.id)}
                >
                  <span>{faq.question}</span>
                  <span className="faq-icon">{expandedFAQ === faq.id ? '−' : '+'}</span>
                </button>
                {expandedFAQ === faq.id && (
                  <div className="faq-answer">{faq.answer}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="support-section" id="support">
        <div className="container">
          <h2>Still Need Help?</h2>
          <div className="support-options">
            <div className="support-card">
              <div className="support-icon">📧</div>
              <h3>Email Support</h3>
              <p>nilaykumar2006@ce.du.ac.in</p>
              <small>Response within 24 hours</small>
            </div>
            <div className="support-card">
              <div className="support-icon">📞</div>
              <h3>Phone Support</h3>
              <p>+91 7304690068 </p>
              <small>Mon–Fri: 9 AM – 6 PM IST</small>
            </div>
            <div className="support-card">
              <div className="support-icon">📍</div>
              <h3>Visit Us</h3>
              <p>Maharisi Kanad Bhavan, Delhi – 110007</p>
              <small>By appointment only</small>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
