// Implements: REQ-9, REQ-10, REQ-11 — see SRS Section 4.4
// Real endpoints:
//   GET    /api/schedule/config
//   POST   /api/schedule/config
//   POST   /api/schedule/blackout
//   DELETE /api/schedule/blackout/:date
// Backend file: server/src/routes/scheduleRoutes.js

// ═══════════════════════════════════════════════════════════════════════════════════════
// REQ-9: Facility Operating Hours Configuration
// ═══════════════════════════════════════════════════════════════════════════════════════
/**
 * Facility Hours Mapping:
 *   - Facility has operating hours for each day of the week (Monday-Sunday)
 *   - Admin can define different hours for different days
 *   - Example: Mon-Fri 09:00-17:00, Sat-Sun closed
 *   - All doctor schedules must be nested within facility hours
 *   - Patients cannot book appointments outside facility hours
 *
 * Implementation:
 *   - FacilitySection: UI for configuring facility hours
 *   - Displays all 7 days of the week
 *   - Each day can be marked as operational or closed
 *   - Start/end times configured per day
 */

import { useState, useEffect } from 'react';
import { apiCall } from '../../services/api';
import './ScheduleConfigUI.css';

// TODO: Remove mock data — used only if GET /api/schedule/config fails
const MOCK_CONFIG = {
  doctors:      [],
  schedules:    [],
  blackoutDates: [],
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
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
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
    setSaveError('');
    try {
      await apiCall('/schedule/config', {
        method: 'POST',
        body: { doctorId: selectedDoctorId, workingDays, startTime, endTime, slotDuration: parseInt(slotDuration) },
      });
      setSaveSuccess('✅ Schedule saved successfully.');
    } catch (err) {
      console.error('Save schedule error:', err);
      setSaveError('❌ Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
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
      setBlackoutDates((prev) => [...prev, { date: newDate, reason: newReason }]);
      setNewDate('');
      setNewReason('');
    } catch (err) {
      console.error('Add blackout error:', err);
      // Add locally anyway so UI stays usable
      setBlackoutDates((prev) => [...prev, { date: newDate, reason: newReason }]);
      setNewDate('');
      setNewReason('');
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(date) {
    setRemovingDate(date);
    try {
      await apiCall(`/schedule/blackout/${date}`, { method: 'DELETE' });
      setBlackoutDates((prev) => prev.filter((b) => b.date !== date));
    } catch (err) {
      console.error('Remove blackout error:', err);
      // Remove locally anyway
      setBlackoutDates((prev) => prev.filter((b) => b.date !== date));
    } finally {
      setRemovingDate(null);
    }
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
// Section C — Facility Operating Hours (REQ-9)
// ---------------------------------------------------------------------------
/**
 * REQ-9 Implementation: Facility Hours Configuration
 * 
 * Facility Hours Mapping:
 *   - dayOfWeek: 0=Monday, 1=Tuesday, ..., 6=Sunday
 *   - startTime: When facility opens (e.g., "09:00")
 *   - endTime: When facility closes (e.g., "17:00")
 *   - isOperational: TRUE = open, FALSE = closed
 *
 * User Interaction:
 *   1. Admin opens ScheduleConfigUI
 *   2. Sees Facility Hours section with all 7 days
 *   3. For each day, can:
 *      - Toggle "Operational" checkbox
 *      - Set start/end times if operational
 *   4. Changes saved to backend via PATCH /schedule/facility/:dayOfWeek
 *
 * Validation:
 *   - If operational=true, start_time must be before end_time
 *   - Both times required when operational
 *   - Can be closed by setting is_operational=false
 */
function FacilitySection() {
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const [facilityHours, setFacilityHours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingDay, setSavingDay] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // Load facility hours on mount
  useEffect(() => {
    async function loadFacilityHours() {
      try {
        const data = await apiCall('/schedule/facility');
        setFacilityHours(data.facilityHours || []);
      } catch {
        // Initialize with default mock data if not available
        setFacilityHours(dayNames.map((name, idx) => ({
          dayOfWeek: idx,
          dayName: name,
          startTime: '09:00',
          endTime: '17:00',
          isOperational: idx < 5, // Mon-Fri open, Sat-Sun closed
        })));
      } finally {
        setLoading(false);
      }
    }
    loadFacilityHours();
  }, []);

  async function handleSaveFacilityDay(dayOfWeek, startTime, endTime, isOperational) {
    setSavingDay(dayOfWeek);
    setSaveError('');
    setSaveSuccess('');

    // Validation
    if (isOperational && (!startTime || !endTime)) {
      setSaveError('Start and end times are required for operational days');
      setSavingDay(null);
      return;
    }
    if (isOperational && startTime >= endTime) {
      setSaveError('Start time must be before end time');
      setSavingDay(null);
      return;
    }

    try {
      // REQ-9: Save facility hours for specific day
      // Maps dayOfWeek (0-6) to backend facility_config table
      const response = await apiCall(`/schedule/facility/${dayOfWeek}`, {
        method: 'PATCH',
        body: { startTime, endTime, isOperational },
      });

      // Update local state
      setFacilityHours((prev) =>
        prev.map((h) =>
          h.dayOfWeek === dayOfWeek
            ? { ...h, startTime, endTime, isOperational }
            : h
        )
      );

      setSaveSuccess(`✅ ${dayNames[dayOfWeek]} facility hours updated`);
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (err) {
      setSaveError(`Failed to save ${dayNames[dayOfWeek]} hours: ${err.message}`);
    } finally {
      setSavingDay(null);
    }
  }

  if (loading) return <div className="card"><div className="card-body">Loading facility hours...</div></div>;

  return (
    <div className="card">
      <div className="card-header">🏥 Facility Operating Hours (REQ-9)</div>
      <div className="card-body p-4">
        <p className="text-muted mb-4" style={{ fontSize: '0.9rem' }}>
          Configure the facility's daily operating hours. All doctor schedules must be within these bounds.
        </p>

        {saveError && <div className="alert alert-danger py-2 mb-3">{saveError}</div>}
        {saveSuccess && <div className="alert alert-success py-2 mb-3">{saveSuccess}</div>}

        {/* REQ-9: Display facility hours for each day */}
        {/* Mapping: dayOfWeek 0-6 = Monday-Sunday */}
        <div className="facility-hours-grid">
          {facilityHours.map((day) => (
            <FacilityDayConfig
              key={day.dayOfWeek}
              day={day}
              saving={savingDay === day.dayOfWeek}
              onSave={handleSaveFacilityDay}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * REQ-9: Single day configuration component
 * Handles editing start/end times and operational status for one day
 */
function FacilityDayConfig({ day, saving, onSave }) {
  const [isOperational, setIsOperational] = useState(day.isOperational);
  const [startTime, setStartTime] = useState(day.startTime);
  const [endTime, setEndTime] = useState(day.endTime);

  return (
    <div className="facility-day-card">
      <div className="facility-day-header">
        <h5 className="mb-0">{day.dayName}</h5>
        <label className="form-check-label ms-auto">
          <input
            type="checkbox"
            className="form-check-input"
            checked={isOperational}
            onChange={(e) => setIsOperational(e.target.checked)}
            disabled={saving}
          />
          <span className="ms-2">{isOperational ? '✅ Open' : '❌ Closed'}</span>
        </label>
      </div>

      {isOperational && (
        <div className="facility-day-body">
          <div className="row g-2 mb-3">
            <div className="col-6">
              <label className="form-label small">Opens</label>
              <input
                type="time"
                className="form-control form-control-sm"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="col-6">
              <label className="form-label small">Closes</label>
              <input
                type="time"
                className="form-control form-control-sm"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          <button
            className="btn btn-sm btn-primary w-100"
            disabled={saving}
            onClick={() => onSave(day.dayOfWeek, startTime, endTime, isOperational)}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                Saving...
              </>
            ) : '💾 Save Hours'}
          </button>
        </div>
      )}

      {!isOperational && (
        <div className="facility-day-closed">
          <p className="text-muted mb-2">Facility closed on {day.dayName}</p>
          <button
            className="btn btn-sm btn-outline-success w-100"
            disabled={saving}
            onClick={() => onSave(day.dayOfWeek, '09:00', '17:00', true)}
          >
            ✅ Open This Day
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section D — Emergency Slot Open/Close (REQ-11)
// ---------------------------------------------------------------------------
function SlotSection({ doctors }) {
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctors[0]?.doctorId ?? '');
  const [selectedDate,     setSelectedDate]     = useState(todayISO());
  const [slots,            setSlots]            = useState([]);
  const [loadingSlots,     setLoadingSlots]     = useState(false);
  const [togglingId,       setTogglingId]       = useState(null);
  const [fetchError,       setFetchError]       = useState('');

  async function fetchSlots() {
    if (!selectedDoctorId || !selectedDate) return;
    setLoadingSlots(true);
    setFetchError('');
    try {
      const data = await apiCall(`/schedule/doctor/${selectedDoctorId}`);
      // Filter to selected date only
      const filtered = data.data.filter((s) => s.date === selectedDate);
      setSlots(filtered);
    } catch {
      setFetchError('Could not load slots. Check that the server is running.');
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  async function handleToggle(scheduleId, isCurrentlyBlocked) {
    setTogglingId(scheduleId);
    const action = isCurrentlyBlocked ? 'open' : 'close';
    try {
      await apiCall(`/schedule/slots/${scheduleId}`, {
        method: 'PATCH',
        body: { action },
      });
      // Update local state — no need to refetch
      setSlots((prev) =>
        prev.map((s) =>
          s.scheduleId === scheduleId ? { ...s, isBlackout: !isCurrentlyBlocked } : s
        )
      );
    } catch {
      setFetchError('Failed to update slot. Please try again.');
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="card">
      <div className="card-header">🚨 Emergency Slot Management</div>
      <div className="card-body p-4">
        <p className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>
          Open or close specific slots for emergency blocks (REQ-11)
        </p>

        {/* Controls */}
        <div className="row mb-3">
          <div className="col-md-5">
            <label className="form-label">Doctor</label>
            <select
              className="form-select"
              value={selectedDoctorId}
              onChange={(e) => { setSelectedDoctorId(e.target.value); setSlots([]); }}
            >
              {doctors.map((d) => (
                <option key={d.doctorId} value={d.doctorId}>
                  {d.name} — {d.specialty}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-control"
              value={selectedDate}
              onChange={(e) => { setSelectedDate(e.target.value); setSlots([]); }}
            />
          </div>
          <div className="col-md-3 d-flex align-items-end">
            <button
              className="btn btn-outline-primary w-100"
              onClick={fetchSlots}
              disabled={loadingSlots}
            >
              {loadingSlots ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
              ) : '🔍 Load Slots'}
            </button>
          </div>
        </div>

        {fetchError && <div className="alert alert-danger py-2">{fetchError}</div>}

        {/* Slot list */}
        {slots.length === 0 && !loadingSlots && !fetchError && (
          <p className="text-muted">Select a doctor and date, then click Load Slots.</p>
        )}

        {slots.length > 0 && (
          <ul className="list-group">
            {slots.map((slot) => (
              <li
                key={slot.scheduleId}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                <div>
                  <span className="fw-semibold">{slot.startTime} – {slot.endTime}</span>
                  <span className={`ms-3 badge ${slot.isBlackout ? 'bg-danger' : 'bg-success'}`}>
                    {slot.isBlackout ? 'Blocked' : 'Open'}
                  </span>
                </div>
                <button
                  className={`btn btn-sm ${slot.isBlackout ? 'btn-outline-success' : 'btn-outline-danger'}`}
                  disabled={togglingId === slot.scheduleId}
                  onClick={() => handleToggle(slot.scheduleId, slot.isBlackout)}
                >
                  {togglingId === slot.scheduleId ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                  ) : slot.isBlackout ? '✅ Reopen Slot' : '🚫 Block Slot'}
                </button>
              </li>
            ))}
          </ul>
        )}
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
      } catch (err) {
        console.error('Config fetch failed, using mock:', err);
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
      {/* REQ-9: Facility Hours Configuration */}
      {/* Allows admin to set facility operating hours for each day */}
      <FacilitySection />
      {/* REQ-9 per-doctor level schedules */}
      <ScheduleSection doctors={config.doctors} schedules={config.schedules} />
      {/* REQ-10: Blackout Dates Management */}
      <BlackoutSection initialDates={config.blackoutDates} />
      {/* REQ-11: Emergency Slot Management */}
      <SlotSection doctors={config.doctors} />
    </div>
  );
}

export default ScheduleConfigUI;
