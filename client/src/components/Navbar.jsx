/**
 * ========================================
 * NAVBAR COMPONENT
 * Global navigation bar shown on all pages
 * ========================================
 * Features:
 * - Responsive navigation
 * - Navigation links for About, Contact, Help
 * - Conditional rendering based on auth state
 * - Logout functionality
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  // Get user state and logout function from auth context
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      {/* ===== BRAND / LOGO ===== */}
      {/* Links to home page, always visible */}
      <Link to="/" className="nav-brand">
        Patient Portal
      </Link>

      {/* ===== MOBILE MENU TOGGLE ===== */}
      <button 
        className="mobile-menu-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        ☰
      </button>

      {/* ===== NAVIGATION MENU ===== */}
      {/* Center navigation links */}
      <div className={`nav-menu ${mobileMenuOpen ? 'active' : ''}`}>
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/about" className="nav-link">About Us</Link>
        <Link to="/contact" className="nav-link">Contact</Link>
        <Link to="/help" className="nav-link">Help</Link>
      </div>

      {/* ===== NAVIGATION ACTIONS ===== */}
      {/* Right-aligned buttons, change based on auth state */}
      <div className="nav-links">
        {user ? (
          <>
            {/* Authenticated User: Show greeting and actions */}
            <span style={{ 
              color: 'var(--text-primary)', 
              fontSize: '0.95rem', 
              fontWeight: 600,
              padding: '0.5rem 0.75rem'
            }}>
              
            </span>
            {/* REQ-4: Find Doctors link for authenticated users */}
            <Link to="/doctors" className="nav-btn outline">
              👨‍⚕️ Find Doctors
            </Link>
            <Link to="/dashboard" className="nav-btn outline">Dashboard</Link>
            <button 
              onClick={logout} 
              className="nav-btn outline" 
              style={{ cursor: 'pointer', border: 'none' }}
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            {/* Unauthenticated User: Show login and register links */}
            <Link to="/login" className="nav-btn outline">Sign In</Link>
            <Link to="/register" className="nav-btn solid">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
