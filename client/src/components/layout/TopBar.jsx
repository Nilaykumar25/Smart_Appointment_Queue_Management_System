// Implements: REQ-1 — see SRS Section 4.1 (Role-Based Access Control)

import { getName, getRole } from '../../services/auth';
import './TopBar.css';

function TopBar({ title }) {
  const name = getName();
  const role = getRole();

  const badgeClass = role === 'admin' ? 'badge bg-primary' : 'badge bg-secondary';
  const roleLabel  = role ? role.charAt(0).toUpperCase() + role.slice(1) : '';

  return (
    <header className="topbar">
      <span className="topbar-title">{title}</span>
      <div className="topbar-right">
        <span className="topbar-name">Hello, {name}</span>
        <span className={badgeClass}>{roleLabel}</span>
      </div>
    </header>
  );
}

export default TopBar;
