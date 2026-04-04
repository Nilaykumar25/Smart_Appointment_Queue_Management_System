/**
 * ========================================
 * LOGIN PAGE COMPONENT
 * Authenticates existing patients
 * ========================================
 * Route: /login
 * Access: Public (redirects authenticated users)
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  // ===== STATE MANAGEMENT =====
  
  // Stores form input values
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Stores field-specific validation errors
  const [errors, setErrors] = useState({});
  
  // Stores general authentication errors
  const [authError, setAuthError] = useState('');
  
  // ===== ROUTING & CONTEXT =====
  
  // Get login function from auth context
  const { login } = useAuth();
  
  // Navigation hook for programmatic routing
  const navigate = useNavigate();

  // ===== EVENT HANDLERS =====

  /**
   * Updates form data on input change
   * Clears field errors as user starts correcting
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error message when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  /**
   * Validates email and password fields
   * Returns true if all validations pass
   */
  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handles form submission
   * Validates form, calls login API, navigates to dashboard
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    // Only proceed if form is valid
    if (validateForm()) {
      try {
        // Call login function from auth context
        await login(formData.email, formData.password);
        
        // Navigate to protected dashboard route
        navigate('/dashboard');
      } catch (err) {
        // Display authentication error to user
        setAuthError('Invalid email or password. Please try again.');
      }
    }
  };

  // ===== RENDER =====

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Form Header */}
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to your patient account</p>

        {/* Display general errors (e.g., invalid credentials) */}
        {authError && <div className="alert error">{authError}</div>}

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Email Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              className={`form-input ${errors.email ? 'error' : ''}`}
              value={formData.email}
              onChange={handleChange}
              placeholder="name@example.com"
              autoComplete="email"
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          {/* Password Field */}
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
              autoComplete="current-password"
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          {/* Submit Button */}
          <button type="submit" className="auth-button">Sign In</button>
        </form>

        {/* Link to Registration Page */}
        <div className="auth-link">
          Don't have an account? <Link to="/register">Create one now</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
