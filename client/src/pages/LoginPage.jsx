// Implements: REQ-1 — see SRS Section 4.1 (User Registration and Authentication)

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, isAuthenticated, getRole } from '../services/auth';
import './LoginPage.css';

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading]       = useState(false);

  // Redirect already-authenticated users away from login
  useEffect(() => {
    if (isAuthenticated()) {
      const role = getRole();
      if (role === 'admin') navigate('/admin/reports', { replace: true });
      else if (role === 'staff') navigate('/staff/queue', { replace: true });
    }
  }, [navigate]);

  function validate() {
    const errors = { email: '', password: '' };
    let valid = true;

    if (!email.trim()) {
      errors.email = 'Email is required.';
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Enter a valid email address.';
      valid = false;
    }

    if (!password) {
      errors.password = 'Password is required.';
      valid = false;
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
      valid = false;
    }

    setFieldErrors(errors);
    return valid;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setGeneralError('');

    if (!validate()) return;

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      setGeneralError(result.message);
      setPassword('');
      return;
    }

    if (result.role === 'patient') {
      setGeneralError('This portal is for clinic staff only.');
      setPassword('');
      return;
    }

    if (result.role === 'admin') navigate('/admin/reports');
    else if (result.role === 'staff') navigate('/staff/queue');
  }

  function handleEmailChange(e) {
    setEmail(e.target.value);
    if (generalError) setGeneralError('');
  }

  function handlePasswordChange(e) {
    setPassword(e.target.value);
    if (generalError) setGeneralError('');
  }

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="login-logo">
          <span className="emoji">🏥</span>
          <h1>SAQMS</h1>
          <p>Staff &amp; Admin Portal</p>
        </div>

        {generalError && (
          <div className="alert alert-danger" role="alert">
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="Enter your work email"
              value={email}
              onChange={handleEmailChange}
              disabled={loading}
            />
            {fieldErrors.email && (
              <div className="field-error">{fieldErrors.email}</div>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              type="password"
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={handlePasswordChange}
              disabled={loading}
            />
            {fieldErrors.password && (
              <div className="field-error">{fieldErrors.password}</div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

      </div>
    </div>
  );
}

export default LoginPage;
