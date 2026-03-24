import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  // State for tracking form input values
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // State for tracking field-specific validation errors
  const [errors, setErrors] = useState({});
  // State for general login failure messages
  const [authError, setAuthError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Handles input changes and clears errors actively when typing
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear validation error when user begins to correct it
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validates form input and returns true if valid, tracking errors otherwise
  const validateForm = () => {
    const newErrors = {};
    
    // Check if email is empty
    if (!formData.email) {
      newErrors.email = 'Email is required';
      // Simple regex for email format validation
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Check if password meets minimum requirements
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Trigger login process when form is valid
  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (validateForm()) {
      try {
        await login(formData.email, formData.password);
        console.log('Login successful');
        // Navigate securely to dashboard
        navigate('/dashboard');
      } catch (err) {
        setAuthError('Invalid email or password');
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Log in to manage your appointments</p>

        {/* Display general auth errors (e.g., incorrect credentials) */}
        {authError && <div className="alert error">{authError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email Form Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              // Add 'error' class if field has validation issue
              className={`form-input ${errors.email ? 'error' : ''}`}
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
            />
            {/* Field specific error output */}
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          {/* Password Form Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className={`form-input ${errors.password ? 'error' : ''}`}
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          {/* Submit Action */}
          <button type="submit" className="auth-button">
            Log In
          </button>
        </form>

        {/* Navigation Link to registration page */}
        <div className="auth-link">
          Don't have an account? <Link to="/register">Register here</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
