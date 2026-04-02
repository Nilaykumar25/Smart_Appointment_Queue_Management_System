import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminShell from './components/layout/AdminShell';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import QueueDashboard from './pages/staff/QueueDashboard';
import BroadcastAlertForm from './pages/staff/BroadcastAlertForm';

// ---------------------------------------------------------------------------
// Placeholder pages — will be replaced with real imports in later tasks
// ---------------------------------------------------------------------------
const ScheduleConfigUI = () => <div className="p-4"><h2>Schedule Configuration</h2><p>Coming in Task 6</p></div>;
const ReportsPage      = () => <div className="p-4"><h2>Reports &amp; Export</h2><p>Coming in Task 7</p></div>;
// ---------------------------------------------------------------------------

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Staff + Admin routes */}
        <Route element={<ProtectedRoute allowedRoles={['staff', 'admin']} />}>
          <Route element={<AdminShell />}>
            <Route path="/staff/queue"     element={<QueueDashboard />} />
            <Route path="/staff/broadcast" element={<BroadcastAlertForm />} />
          </Route>
        </Route>

        {/* Admin-only routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route element={<AdminShell />}>
            <Route path="/admin/schedule" element={<ScheduleConfigUI />} />
            <Route path="/admin/reports"  element={<ReportsPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
