import { useState } from 'react';
import '../styles/Help.css';

export default function Help() {
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const faqs = [
    {
      id: 1,
      question: 'How do I create an account?',
      answer: 'Visit our registration page, fill in your basic information (name, email, password), verify your email, and you\'re all set! The whole process takes less than 2 minutes.'
    },
    {
      id: 2,
      question: 'How do I book an appointment?',
      answer: 'After logging in, go to "Book Appointment", select a healthcare provider, choose your preferred date and time from available slots, and confirm your booking.'
    },
    {
      id: 3,
      question: 'Can I reschedule an appointment?',
      answer: 'Yes, you can reschedule appointments up to 24 hours before the scheduled time. Go to "My Appointments" and click the reschedule option.'
    },
    {
      id: 4,
      question: 'How does the queue system work?',
      answer: 'When you book an appointment, you\'re added to a digital queue. You can track your position in real-time and receive notifications as your turn approaches.'
    },
    {
      id: 5,
      question: 'What notifications will I receive?',
      answer: 'You\'ll get notifications for appointment confirmations, reminders 24 hours before, updates on queue status, and any changes to your appointments.'
    },
    {
      id: 6,
      question: 'Is my personal data secure?',
      answer: 'Yes, we use end-to-end encryption, comply with HIPAA standards, and never share your data with third parties without consent.'
    },
    {
      id: 7,
      question: 'How can I update my profile?',
      answer: 'Go to Account Settings in your dashboard to update your name, email, phone number, and other profile information.'
    },
    {
      id: 8,
      question: 'What if I have a problem accessing the site?',
      answer: 'Check our system status page first. If the issue persists, contact our support team at support@patientportal.com or call +1-800-728-4837.'
    }
  ];

  const toggleFAQ = (id) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <div className="help-container">
      {/* Hero */}
      <section className="help-hero">
        <h1>Help & Support</h1>
        <p>Find answers to common questions and learn how to make the most of Patient Portal</p>
      </section>

      {/* Quick Navigation */}
      <section className="quick-nav">
        <div className="container">
          <h2>Quick Navigation</h2>
          <div className="nav-cards">
            <a href="#getting-started" className="nav-card">
              <div className="card-icon">🚀</div>
              <h3>Getting Started</h3>
              <p>New to our platform? Start here</p>
            </a>
            <a href="#faqs" className="nav-card">
              <div className="card-icon">❓</div>
              <h3>FAQs</h3>
              <p>Answers to common questions</p>
            </a>
            <a href="#support" className="nav-card">
              <div className="card-icon">💬</div>
              <h3>Contact Support</h3>
              <p>Get help from our team</p>
            </a>
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section className="getting-started" id="getting-started">
        <div className="container">
          <h2>Getting Started</h2>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Create Your Account</h3>
              <p>Sign up with your email and create a secure password. Verify your email address to activate your account.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Complete Your Profile</h3>
              <p>Add your medical history, emergency contacts, and insurance information for faster check-ins.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Book an Appointment</h3>
              <p>Browse available healthcare providers, select a time slot, and confirm your appointment.</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step">
              <div className="step-number">4</div>
              <h3>Manage Your Queue</h3>
              <p>Track your position in queue, receive notifications, and be ready for your appointment.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
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
                  <div className="faq-answer">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="support-section" id="support">
        <div className="container">
          <h2>Still Need Help?</h2>
          <div className="support-options">
            <div className="support-card">
              <div className="support-icon">📧</div>
              <h3>Email Support</h3>
              <p>support@patientportal.com</p>
              <small>Response within 24 hours</small>
            </div>
            <div className="support-card">
              <div className="support-icon">📞</div>
              <h3>Phone Support</h3>
              <p>+1 (800) 728-4837</p>
              <small>Mon-Fri: 9 AM - 6 PM EST</small>
            </div>
            <div className="support-card">
              <div className="support-icon"></div>
              <h3>Knowledge Base</h3>
              <p>View all articles</p>
              <small>Searchable documentation</small>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
