import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { QueueProvider } from './context/QueueContext';

// Layout
import Navbar from './components/Navbar';
import AdminShell from './components/layout/AdminShell';
import ProtectedRoute from './components/common/ProtectedRoute';

// Public pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import Help from './pages/Help';
import LoginPage from './pages/LoginPage';

// Patient pages
import DoctorSearch from './pages/DoctorSearch';
import BookAppointment from './pages/BookAppointment';
import BookingConfirmation from './pages/BookingConfirmation';
import Dashboard from './pages/Dashboard';

// Staff pages
import QueueDashboard from './pages/staff/QueueDashboard';
import BroadcastAlertForm from './pages/staff/BroadcastAlertForm';

// Admin pages
import ScheduleConfigUI from './pages/admin/ScheduleConfigUI';
import ReportsPage from './pages/admin/ReportsPage';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <QueueProvider>
        <BrowserRouter>
          <Routes>
            {/* ── Public routes ── */}
            <Route path="/"         element={<Home />} />
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/about"    element={<AboutUs />} />
            <Route path="/contact"  element={<ContactUs />} />
            <Route path="/help"     element={<Help />} />

            {/* Staff / Admin login page */}
            <Route path="/staff-login" element={<LoginPage />} />

            {/* ── Patient protected routes ── */}
            <Route element={<ProtectedRoute allowedRoles={['patient', 'staff', 'admin']} />}>
              <Route path="/doctors"                      element={<><Navbar /><DoctorSearch /></>} />
              <Route path="/book-appointment/:doctorId"   element={<><Navbar /><BookAppointment /></>} />
              <Route path="/booking-confirmation"         element={<><Navbar /><BookingConfirmation /></>} />
              <Route path="/dashboard"                    element={<><Navbar /><Dashboard /></>} />
            </Route>

            {/* ── Staff + Admin routes ── */}
            <Route element={<ProtectedRoute allowedRoles={['staff', 'admin']} />}>
              <Route element={<AdminShell />}>
                <Route path="/staff/queue"     element={<QueueDashboard />} />
                <Route path="/staff/broadcast" element={<BroadcastAlertForm />} />
              </Route>
            </Route>

            {/* ── Admin-only routes ── */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route element={<AdminShell />}>
                <Route path="/admin/schedule" element={<ScheduleConfigUI />} />
                <Route path="/admin/reports"  element={<ReportsPage />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </QueueProvider>
    </AuthProvider>
  );
}

export default App;
