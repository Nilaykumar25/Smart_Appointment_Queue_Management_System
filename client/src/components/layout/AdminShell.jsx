// Implements: REQ-1 — see SRS Section 4.1 (Role-Based Access Control)

import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import './AdminShell.css';

const PAGE_TITLES = {
  '/staff/queue':     'Queue Dashboard',
  '/staff/broadcast': 'Broadcast Alert',
  '/admin/schedule':  'Schedule Configuration',
  '/admin/reports':   'Reports & Export',
};

function AdminShell() {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] ?? 'SAQMS';

  return (
    <div className="shell-wrapper">
      <Sidebar />
      <div className="shell-main">
        <TopBar title={title} />
        <div className="shell-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AdminShell;
