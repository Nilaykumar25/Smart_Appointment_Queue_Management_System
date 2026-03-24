import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  // Pull current user state and logout mechanism from auth context
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      {/* Platform Brand / Title linked to home */}
      <Link to="/" className="nav-brand">
        Patient Portal
      </Link>

      {/* Action buttons pinned to the rightmost side */}
      <div className="nav-links">
        {user ? (
          <>
            <span style={{ color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 500 }}>
              Welcome, {user.name}
            </span>
            <button onClick={logout} className="nav-btn outline" style={{ cursor: 'pointer' }}>
              Log Out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-btn outline">Log In</Link>
            <Link to="/register" className="nav-btn solid">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
