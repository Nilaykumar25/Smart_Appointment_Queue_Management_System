// Implements: REQ-9  — see SRS Section 4.4 (Clinic Schedule Management)
// Implements: REQ-10 — see SRS Section 4.4 (Blackout Dates)
// Implements: REQ-11 — see SRS Section 4.4 (Open/Close Slots)

import { useState, useEffect } from 'react';
import { apiCall } from '../../services/api';
import './ScheduleConfigUI.css';

// TODO: Remove mock data when backend is ready
const MOCK_CONFIG = {
  doctors: [
    { doctorId: 'D01', name: 'Dr. Sharma', specialty: 'General'     },
    { doctorId: 'D02', name: 'Dr. Patel',  specialty: 'Pediatrics'  },
    { doctorId: 'D03', name: 'Dr. Kapoor', specialty: 'Cardiology'  },
  ],
  schedules: [
    {
      doctorId:     'D01',
      workingDays:  ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      startTime:    '09:00',
      endTime:      '17:00',
      slotDuration: 15,
    },
  ],
  blackoutDates: [
    { date: '2026-04-14', reason: 'Ambedkar Jayanti' },
    { date: '2026-04-18', reason: 'Good Friday'      },
  ],
};

const ALL_DAYS    = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SLOT_OPTIONS = [10, 15, 20, 30];

const EMPTY_SCHEDULE = {
  workingDays:  [],
  startTime:    '',
  endTime:      '',
  slotDuration: 15,
};

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

// ---------------------------------------------------------------------------
// Section A — Doctor Schedule Setup
// ---------------------------------------------------------------------------
function ScheduleSection({ doctors, schedules }) {
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctors[0]?.doctorId ?? '');
  const [workingDays,  setWorkingDays]  = useState([]);
  const [startTime,    setStartTime]    = useState('');
  const [endTime,      setEndTime]      = useState('');
  const [slotDuration, setSlotDuration] = useState(15);
  const [saveError,    setSaveError]    = useState('');
  const [saveSuccess,  setSaveSuccess]  = useState('');
  const [saving,       setSaving]       = useState(false);

  function populateFromDoctor(doctorId) {
    const sched = schedules.find((s) => s.doctorId === doctorId) ?? EMPTY_SCHEDULE;
    setWorkingDays(sched.workingDays);
    setStartTime(sched.startTime);
    setEndTime(sched.endTime);
    setSlotDuration(sched.slotDuration);
  }

  // Populate on mount with first doctor
  useEffect(() => {
    if (selectedDoctorId) populateFromDoctor(selectedDoctorId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleDoctorChange(e) {
    const id = e.target.value;
    setSelectedDoctorId(id);
    setSaveError('');
    setSaveSuccess('');
    populateFromDoctor(id);
  }

  function toggleDay(day) {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function validate() {
    if (workingDays.length === 0) { setSaveError('Please select at least one working day.'); return false; }
    if (!startTime)               { setSaveError('Please set a start time.');                return false; }
    if (!endTime)                 { setSaveError('Please set an end time.');                 return false; }
    if (startTime >= endTime)     { setSaveError('Start time must be before end time.');     return false; }
    setSaveError('');
    return true;
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setSaveSuccess('');
    try {
      await apiCall('/schedule/config', {
        method: 'POST',
        body: { doctorId: selectedDoctorId, workingDays, startTime, endTime, slotDuration },
      });
    } catch {
      // TODO: Remove mock success when backend is ready
    }
    setSaveSuccess('✅ Schedule saved successfully.');
    setSaving(false);
  }

  // Auto-clear success message after 4 seconds
  useEffect(() => {
    if (!saveSuccess) return;
    const t = setTimeout(() => setSaveSuccess(''), 4000);
    return () => clearTimeout(t);
  }, [saveSuccess]);

  return (
    <div className="card">
      <div className="card-header">👨‍⚕️ Doctor Schedule Configuration</div>
      <div className="card-body p-4">
        <form onSubmit={handleSave} noValidate>

          {/* Doctor selector */}
          <div className="mb-3">
            <label htmlFor="doctor-select" className="form-label">Select Doctor</label>
            <select
              id="doctor-select"
              className="form-select"
              value={selectedDoctorId}
              onChange={handleDoctorChange}
              disabled={saving}
            >
              {doctors.map((d) => (
                <option key={d.doctorId} value={d.doctorId}>
                  {d.name} — {d.specialty}
                </option>
              ))}
            </select>
          </div>

          {/* Working days */}
          <div className="mb-3">
            <label className="form-label">Working Days</label>
            <div className="working-days">
              {ALL_DAYS.map((day) => (
                <div className="form-check" key={day}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`day-${day}`}
                    checked={workingDays.includes(day)}
                    onChange={() => toggleDay(day)}
                    disabled={saving}
                  />
                  <label className="form-check-label" htmlFor={`day-${day}`}>{day}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Start / End time */}
          <div className="row mb-3">
            <div className="col-md-6">
              <label htmlFor="start-time" className="form-label">Start Time</label>
              <input
                id="start-time"
                type="time"
                className="form-control"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="col-md-6">
              <label htmlFor="end-time" className="form-label">End Time</label>
              <input
                id="end-time"
                type="time"
                className="form-control"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          {/* Slot duration */}
          <div className="mb-4">
            <label htmlFor="slot-duration" className="form-label">Appointment Slot Duration</label>
            <select
              id="slot-duration"
              className="form-select"
              value={slotDuration}
              onChange={(e) => setSlotDuration(Number(e.target.value))}
              disabled={saving}
            >
              {SLOT_OPTIONS.map((m) => (
                <option key={m} value={m}>{m} minutes</option>
              ))}
            </select>
          </div>

          {saveError   && <div className="field-error mb-2">{saveError}</div>}
          {saveSuccess && <div className="success-msg mb-2">{saveSuccess}</div>}

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                Saving...
              </>
            ) : '💾 Save Schedule'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section B — Blackout Dates
// ---------------------------------------------------------------------------
function BlackoutSection({ initialDates }) {
  const [blackoutDates, setBlackoutDates] = useState(initialDates);
  const [newDate,       setNewDate]       = useState('');
  const [newReason,     setNewReason]     = useState('');
  const [dateError,     setDateError]     = useState('');
  const [reasonError,   setReasonError]   = useState('');
  const [adding,        setAdding]        = useState(false);
  const [removingDate,  setRemovingDate]  = useState(null);

  function validateAdd() {
    let valid = true;
    if (!newDate)         { setDateError('Please select a date.');    valid = false; } else setDateError('');
    if (!newReason.trim()) { setReasonError('Please enter a reason.'); valid = false; } else setReasonError('');
    return valid;
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!validateAdd()) return;

    setAdding(true);
    try {
      await apiCall('/schedule/blackout', {
        method: 'POST',
        body: { date: newDate, reason: newReason },
      });
    } catch {
      // TODO: Remove mock success when backend is ready
    }
    setBlackoutDates((prev) => [...prev, { date: newDate, reason: newReason }]);
    setNewDate('');
    setNewReason('');
    setAdding(false);
  }

  async function handleRemove(date) {
    setRemovingDate(date);
    try {
      await apiCall(`/schedule/blackout/${date}`, { method: 'DELETE' });
    } catch {
      // TODO: Remove mock success when backend is ready
    }
    setBlackoutDates((prev) => prev.filter((b) => b.date !== date));
    setRemovingDate(null);
  }

  return (
    <div className="card">
      <div className="card-header">🚫 Blackout Dates</div>
      <div className="card-body p-4">
        <p className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>
          Block specific dates for holidays or doctor leave
        </p>
        <div className="row">

          {/* Left — existing dates */}
          <div className="col-md-7">
            {blackoutDates.length === 0 ? (
              <p className="text-muted">No blackout dates set.</p>
            ) : (
              <ul className="list-group">
                {blackoutDates.map(({ date, reason }) => (
                  <li
                    key={date}
                    className="list-group-item d-flex justify-content-between align-items-center"
                  >
                    <div>
                      <div className="blackout-item-date">{formatDate(date)}</div>
                      <div className="blackout-item-reason">{reason}</div>
                    </div>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      disabled={removingDate === date}
                      onClick={() => handleRemove(date)}
                    >
                      {removingDate === date ? (
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                      ) : 'Remove'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Right — add new date */}
          <div className="col-md-5">
            <form onSubmit={handleAdd} noValidate>
              <label className="form-label fw-semibold">Add Blackout Date</label>

              <div className="mb-2">
                <input
                  type="date"
                  className="form-control"
                  min={todayISO()}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  disabled={adding}
                />
                {dateError && <div className="field-error">{dateError}</div>}
              </div>

              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Diwali, Doctor Leave"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  disabled={adding}
                />
                {reasonError && <div className="field-error">{reasonError}</div>}
              </div>

              <button type="submit" className="btn btn-outline-danger w-100" disabled={adding}>
                {adding ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                    Adding...
                  </>
                ) : '➕ Add Date'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
function ScheduleConfigUI() {
  const [config,  setConfig]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    async function fetchConfig() {
      try {
        const data = await apiCall('/schedule/config');
        setConfig(data);
      } catch {
        // TODO: Remove mock fallback when backend is ready
        setConfig(MOCK_CONFIG);
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  if (loading) return (
    <div className="d-flex justify-content-center py-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="schedule-page">
      <h2>Schedule Configuration</h2>
      <ScheduleSection doctors={config.doctors} schedules={config.schedules} />
      <BlackoutSection initialDates={config.blackoutDates} />
    </div>
  );
}

export default ScheduleConfigUI;
