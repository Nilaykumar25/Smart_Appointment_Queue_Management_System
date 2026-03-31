import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import ProtectedRoute from './components/common/ProtectedRoute';

// ---------------------------------------------------------------------------
// Placeholder components — will be replaced with real imports in later tasks
// ---------------------------------------------------------------------------
const LoginPage         = () => <div>Login Page - Coming Soon</div>;
const QueueDashboard    = () => <div>Queue Dashboard - Coming Soon</div>;
const BroadcastAlertForm = () => <div>Broadcast Alert - Coming Soon</div>;
const ScheduleConfigUI  = () => <div>Schedule Config - Coming Soon</div>;
const ReportsPage       = () => <div>Reports Page - Coming Soon</div>;
const AdminShell        = () => <Outlet />;
// ---------------------------------------------------------------------------

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Staff routes */}
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
