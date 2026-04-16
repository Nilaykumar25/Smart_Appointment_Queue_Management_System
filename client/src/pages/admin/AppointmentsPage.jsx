// Implements: Admin view of all upcoming appointments from the database

import { useState, useEffect, useCallback } from 'react';
import { apiCall } from '../../services/api';
import StatusBadge from '../../components/common/StatusBadge';

function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiCall('/appointments/all');
      setAppointments(data);
    } catch {
      setError('Failed to load appointments. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2>All Upcoming Appointments</h2>
          <div className="text-muted" style={{ fontSize: '0.9rem' }}>
            {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} from today onwards
          </div>
        </div>
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={fetchAppointments}
          disabled={loading}
        >
          🔄 Refresh
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-light">
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Specialty</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    No upcoming appointments found.
                  </td>
                </tr>
              ) : (
                appointments.map((a) => (
                  <tr key={a.appointmentId}>
                    <td>{a.date}</td>
                    <td>{a.time}</td>
                    <td>{a.patientName}</td>
                    <td>{a.doctorName}</td>
                    <td>{a.specialty}</td>
                    <td><StatusBadge status={a.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AppointmentsPage;
