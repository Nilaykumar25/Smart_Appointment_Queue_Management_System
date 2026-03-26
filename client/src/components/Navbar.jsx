/**
 * ========================================
 * NAVBAR COMPONENT
 * Global navigation bar shown on all pages
 * ========================================
 * Features:
 * - Responsive navigation
 * - Conditional rendering based on auth state
 * - Logout functionality
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  // Get user state and logout function from auth context
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      {/* ===== BRAND / LOGO ===== */}
      {/* Links to home page, always visible */}
      <Link to="/" className="nav-brand">
        🏥 Patient Portal
      </Link>

      {/* ===== NAVIGATION ACTIONS ===== */}
      {/* Right-aligned buttons, change based on auth state */}
      <div className="nav-links">
        {user ? (
          <>
            {/* Authenticated User: Show greeting and logout */}
            <span style={{ 
              color: 'var(--text-primary)', 
              fontSize: '0.95rem', 
              fontWeight: 600,
              padding: '0.5rem 0.75rem'
            }}>
              {user.name}
            </span>
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
