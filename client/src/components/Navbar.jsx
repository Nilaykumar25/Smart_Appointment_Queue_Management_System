/**
 * ========================================
 * NAVBAR COMPONENT
 * Constant fixed navigation bar shown on all pages
 * ========================================
 * Features:
 * - Fixed position — always visible on scroll
 * - Active link highlighting via NavLink
 * - Home, About Us, Contact, Help nav links
 * - Sign In / Sign Up for unauthenticated users
 * - Dashboard, Find Doctors, Sign Out for authenticated users
 * - Mobile hamburger menu
 * - Backdrop blur glassmorphism effect
 */

import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  /* ── Auth state ── */
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  /* ── Mobile menu toggle ── */
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* ── Scrolled state – adds shadow depth when user scrolls ── */
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /* Close mobile menu on any navigation */
  const closeMobile = () => setMobileMenuOpen(false);

  /* Handle sign-out: clear auth then redirect to login page */
  const handleLogout = () => {
    logout();
    closeMobile();
    navigate('/login');
  };

  /* Helper – returns className for NavLink based on active state */
  const navLinkClass = ({ isActive }) =>
    isActive ? 'nav-link nav-link--active' : 'nav-link';

  return (
    <nav className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}>
      {/* ===== BRAND / LOGO ===== */}
      <Link to="/" className="nav-brand" onClick={closeMobile}>
        <span className="nav-brand-icon">🏥</span>
        Patient Portal
      </Link>

      {/* ===== MOBILE MENU TOGGLE ===== */}
      <button
        id="mobile-menu-btn"
        className="mobile-menu-toggle"
        onClick={() => setMobileMenuOpen(prev => !prev)}
        aria-label="Toggle navigation menu"
        aria-expanded={mobileMenuOpen}
      >
        {mobileMenuOpen ? '✕' : '☰'}
      </button>

      {/* ===== CENTER NAVIGATION LINKS ===== */}
      <div className={`nav-menu${mobileMenuOpen ? ' active' : ''}`}>
        <NavLink to="/" className={navLinkClass} end onClick={closeMobile}>
          Home
        </NavLink>
        <NavLink to="/about" className={navLinkClass} onClick={closeMobile}>
          About Us
        </NavLink>
        <NavLink to="/contact" className={navLinkClass} onClick={closeMobile}>
          Contact
        </NavLink>
        <NavLink to="/help" className={navLinkClass} onClick={closeMobile}>
          Help
        </NavLink>
      </div>

      {/* ===== RIGHT-SIDE ACTION BUTTONS ===== */}
      <div className="nav-links">
        {user ? (
          /* ── Authenticated state ── */
          <>
            <NavLink
              to="/doctors"
              className="nav-btn outline"
              onClick={closeMobile}
            >
              👨‍⚕️ Find Doctors
            </NavLink>
            <NavLink
              to="/dashboard"
              className="nav-btn outline"
              onClick={closeMobile}
            >
              Dashboard
            </NavLink>
            <button
              id="sign-out-btn"
              onClick={handleLogout}
              className="nav-btn solid"
              style={{ cursor: 'pointer' }}
            >
              Sign Out
            </button>
          </>
        ) : (
          /* ── Unauthenticated state ── */
          <>
            <Link
              to="/login"
              id="sign-in-btn"
              className="nav-btn outline"
              onClick={closeMobile}
            >
              Sign In
            </Link>
            <Link
              to="/register"
              id="sign-up-btn"
              className="nav-btn solid"
              onClick={closeMobile}
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
