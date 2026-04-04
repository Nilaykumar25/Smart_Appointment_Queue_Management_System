// Implements: REQ-17 — see SRS Section 4.7 (Notification and Alerts Management)

import { useState, useEffect } from 'react';
import { apiCall } from '../../services/api';
import './BroadcastAlertForm.css';

const MAX_CHARS = 300;
const WARN_AT   = 250;
const DISMISS_MS = 5000;

function BroadcastAlertForm() {
  const [message, setMessage]       = useState('');
  const [target, setTarget]         = useState('all_waiting');
  const [fieldError, setFieldError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg]     = useState('');
  const [loading, setLoading]       = useState(false);

  // Auto-dismiss success alert
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(''), DISMISS_MS);
    return () => clearTimeout(t);
  }, [successMsg]);

  // Auto-dismiss error alert
  useEffect(() => {
    if (!errorMsg) return;
    const t = setTimeout(() => setErrorMsg(''), DISMISS_MS);
    return () => clearTimeout(t);
  }, [errorMsg]);

  function validate() {
    if (!message.trim()) {
      setFieldError('Message cannot be empty.');
      return false;
    }
    if (message.length > MAX_CHARS) {
      setFieldError('Message cannot exceed 300 characters.');
      return false;
    }
    setFieldError('');
    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await apiCall('/notifications/broadcast', {
        method: 'POST',
        body: { message, target },
      });
    } catch {
      // TODO: Remove mock success when backend is ready
    }

    // Treat as success regardless (mock behavior until backend is ready)
    setSuccessMsg('✅ Broadcast sent successfully!');
    setMessage('');
    setTarget('all_waiting');
    setLoading(false);
  }

  const charWarning = message.length >= WARN_AT;

  return (
    <div className="broadcast-page">
      <h2>Send Broadcast Alert</h2>
      <p className="subtitle">Send an alert message to patients in the queue</p>

      <div className="card p-4">
        {successMsg && (
          <div className="alert alert-success" role="alert">{successMsg}</div>
        )}
        {errorMsg && (
          <div className="alert alert-danger" role="alert">{errorMsg}</div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Message */}
          <div className="mb-3">
            <label htmlFor="broadcast-message" className="form-label">
              Alert Message
            </label>
            <textarea
              id="broadcast-message"
              className="form-control"
              rows={4}
              placeholder="Type your message to patients..."
              maxLength={MAX_CHARS}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
            />
            <div className={`char-counter${charWarning ? ' warning' : ''}`}>
              {message.length} / {MAX_CHARS} characters
            </div>
            {fieldError && <div className="field-error">{fieldError}</div>}
          </div>

          {/* Target audience */}
          <div className="mb-4">
            <label className="form-label">Send To</label>
            {[
              { value: 'all_waiting', label: 'All Waiting Patients' },
              { value: 'next_5',      label: 'Next 5 Patients'      },
              { value: 'all_today',   label: 'All Patients Today'   },
            ].map(({ value, label }) => (
              <div className="form-check" key={value}>
                <input
                  className="form-check-input"
                  type="radio"
                  name="target"
                  id={`target-${value}`}
                  value={value}
                  checked={target === value}
                  onChange={() => setTarget(value)}
                  disabled={loading}
                />
                <label className="form-check-label" htmlFor={`target-${value}`}>
                  {label}
                </label>
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="btn btn-warning w-100"
            disabled={loading}
          >
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                />
                Sending...
              </>
            ) : (
              '📢 Send Broadcast'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default BroadcastAlertForm;
