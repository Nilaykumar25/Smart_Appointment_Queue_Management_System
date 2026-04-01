// Implements: REQ-1 — see SRS Section 4.1 (Role-Based Access Control)

import { NavLink, useNavigate } from 'react-router-dom';
import { getRole, logout } from '../../services/auth';
import './Sidebar.css';

function Sidebar() {
  const navigate = useNavigate();
  const role = getRole();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">🏥 SAQMS</div>

      <nav className="sidebar-nav">
        <NavLink to="/staff/queue">🏥 Queue Dashboard</NavLink>
        <NavLink to="/staff/broadcast">📢 Broadcast Alert</NavLink>

        {role === 'admin' && (
          <>
            <NavLink to="/admin/schedule">📅 Schedule Config</NavLink>
            <NavLink to="/admin/reports">📊 Reports</NavLink>
          </>
        )}
      </nav>

      <button className="sidebar-logout" onClick={handleLogout}>
        🚪 Logout
      </button>
    </aside>
  );
}

export default Sidebar;
