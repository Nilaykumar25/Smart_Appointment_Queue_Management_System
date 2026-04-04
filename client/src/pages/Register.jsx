/**
 * ========================================
 * REGISTRATION PAGE COMPONENT
 * Creates new patient accounts
 * ========================================
 * Route: /register
 * Access: Public (redirects authenticated users)
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  // ===== STATE MANAGEMENT =====
  
  // Stores registration form input values
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Stores field-specific validation errors
  const [errors, setErrors] = useState({});
  
  // Stores general registration errors
  const [authError, setAuthError] = useState('');

  // ===== ROUTING & CONTEXT =====
  
  // Get register function from auth context
  const { register } = useAuth();
  
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
   * Validates all registration fields
   * Returns true if all validations pass
   */
  const validateForm = () => {
    const newErrors = {};
    
    // Full name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Full name must be at least 2 characters';
    }

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

    // Password confirmation validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handles form submission
   * Validates form, calls register API, navigates to dashboard
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    // Only proceed if form is valid
    if (validateForm()) {
      try {
        // Call register function from auth context
        // Creates new user account with name and email
        await register(formData.name, formData.email, formData.password);
        
        // Navigate to protected dashboard route
        navigate('/dashboard');
      } catch (err) {
        // Display registration error to user
        setAuthError('Registration failed. Please try again or contact support.');
      }
    }
  };

  // ===== RENDER =====

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Form Header */}
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join us to book and manage appointments</p>

        {/* Display general errors (e.g., email already exists) */}
        {authError && <div className="alert error">{authError}</div>}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} noValidate>
          {/* Full Name Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              className={`form-input ${errors.name ? 'error' : ''}`}
              value={formData.name}
              onChange={handleChange}
              placeholder="John Doe"
              autoComplete="name"
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

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
              autoComplete="new-password"
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          {/* Confirm Password Field */}
          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="new-password"
            />
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>

          {/* Submit Button */}
          <button type="submit" className="auth-button">Create Account</button>
        </form>

        {/* Link to Login Page */}
        <div className="auth-link">
          Already have an account? <Link to="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
