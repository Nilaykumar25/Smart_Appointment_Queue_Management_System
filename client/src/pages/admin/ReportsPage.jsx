// Implements: REQ-19 — see SRS Section 4.8 (Administrative Reporting and Logs)
// Implements: REQ-18 — see SRS Section 4.8 (Audit Logs)
// Real endpoint: GET /api/reports/daily?date=YYYY-MM-DD

import { useState, useEffect, useCallback } from 'react';
import { apiCall } from '../../services/api';
import { useQueue } from '../../context/QueueContext';
import Toast from '../../components/common/Toast';
import './ReportsPage.css';

// Get today's date in local timezone (not UTC) to avoid IST offset issues
function getLocalToday() {
  const d = new Date();
  const year  = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day   = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const today = getLocalToday();

const STATS = [
  { key: 'totalPatientsSeen',      icon: '✅', label: 'Completed',      colorClass: 'stat-green',  borderColor: '#059669' },
  { key: 'totalNoShows',           icon: '❌', label: 'No-Shows',       colorClass: 'stat-red',    borderColor: '#dc2626' },
  { key: 'totalBooked',            icon: '📋', label: 'Booked',         colorClass: 'stat-blue',   borderColor: '#2563EB' },
  { key: 'totalArrived',           icon: '🏥', label: 'Arrived',        colorClass: 'stat-orange', borderColor: '#d97706' },
  { key: 'totalAppointments',      icon: '📅', label: 'Total Appts',    colorClass: 'stat-blue',   borderColor: '#475569' },
  { key: 'averageWaitTimeMinutes', icon: '⏱️', label: 'Avg. Wait Time', colorClass: 'stat-blue',   borderColor: '#2563EB', suffix: ' min' },
];

function ReportsPage() {
  const { liveReport } = useQueue();
  const [date,       setDate]       = useState(today);
  const [report,     setReport]     = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [toast,      setToast]      = useState(null);

  const dismissToast = useCallback(() => setToast(null), []);

  // Fetch report whenever date changes
  useEffect(() => {
    async function fetchReport() {
      setLoading(true);
      setFetchError('');
      try {
        const data = await apiCall('/reports/daily?date=' + date);
        setReport(data);
      } catch (err) {
        console.error('Report fetch failed:', err);
        setFetchError('No data found for this date.');
        setReport(null);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [date]);

  // Use server data if available, otherwise fall back to live context stats
  const displayReport = report ?? liveReport;

  async function handleDownload(format) {
    const ispdf = format === 'pdf';
    if (ispdf) setPdfLoading(true); else setCsvLoading(true);

    try {
      const token = localStorage.getItem('saqms_token');
      const url   = `http://localhost:5000/api/reports/daily?date=${date}&format=${format}`;

      if (ispdf) {
        const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' });
        if (!response.ok) throw new Error('not ok');
        const html = await response.text();
        const blob = new Blob([html], { type: 'text/html' });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      } else {
        const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' });
        if (!response.ok) throw new Error('not ok');
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `SAQMS-Report-${date}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      }
    } catch (err) {
      console.error('Download error:', err);
      setToast({
        message: ispdf
          ? '❌ Could not generate PDF. Make sure the server is running.'
          : '❌ Could not generate CSV. Make sure the server is running.',
        type: 'error',
      });
    } finally {
      if (ispdf) setPdfLoading(false); else setCsvLoading(false);
    }
  }

  const anyDownloading = pdfLoading || csvLoading;

  return (
    <div className="reports-page">
      <h2>📊 Reports &amp; Export</h2>
      <p className="subtitle">View daily clinic statistics and export reports</p>

      {/* Date selector + export buttons */}
      <div className="date-export-row">
        <div className="d-flex align-items-center gap-2">
          <label htmlFor="report-date" className="form-label mb-0 fw-semibold">
            Select Date
          </label>
          <input
            id="report-date"
            type="date"
            className="form-control"
            style={{ width: 'auto' }}
            max={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div>
          <button
            className="btn btn-outline-danger"
            disabled={anyDownloading}
            onClick={() => handleDownload('pdf')}
          >
            {pdfLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                Generating...
              </>
            ) : '📄 Download PDF'}
          </button>

          <button
            className="btn btn-outline-success ms-2"
            disabled={anyDownloading}
            onClick={() => handleDownload('csv')}
          >
            {csvLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                Preparing...
              </>
            ) : '📊 Download CSV'}
          </button>
        </div>
      </div>

      {/* Fetch error banner */}
      {fetchError && (
        <div className="alert alert-danger mb-3">{fetchError}</div>
      )}

      {/* Stat cards */}
      {loading ? (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="row g-3 mb-4">
          {STATS.map(({ key, icon, label, colorClass, borderColor, suffix = '' }) => (
            <div className="col-md-3 col-sm-6" key={key}>
              <div className="stat-card" style={{ borderTop: `3px solid ${borderColor}` }}>
                <div className="stat-icon">{icon}</div>
                <div className={`stat-number ${colorClass}`}>
                  {displayReport[key]}{suffix}
                </div>
                <div className="stat-label">{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Data retention notice */}
      <div className="alert alert-info">
        ℹ️ Appointment data is retained for 7 years as per regulatory requirements (DPDP Act 2023).
        Historical reports are available for all past dates.
      </div>

      {/* Toast for download messages */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={dismissToast} />
      )}
    </div>
  );
}

export default ReportsPage;
