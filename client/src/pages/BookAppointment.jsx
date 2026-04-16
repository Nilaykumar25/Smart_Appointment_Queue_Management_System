/**
 * REQ-5: Book Appointment — fetches real doctors & slots from backend
 * REQ-8: Shows estimated wait time per slot based on avg consultation duration
 * REQ-15: Local schedule cache for offline readability
 */
import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getToken } from '../services/auth';
import { cacheSchedule, getCachedSchedule } from '../services/scheduleCache';
import '../styles/BookAppointment.css';

const BASE_URL = 'http://localhost:5000/api';

export default function BookAppointment() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [doctor, setDoctor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Generate next 7 days
  const availableDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i + 1);
      return d.toISOString().split('T')[0];
    });
  }, []);

  // Fetch doctor info
  useEffect(() => {
    fetch(`${BASE_URL}/doctors`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(r => r.json())
      .then(doctors => {
        const found = doctors.find(d => d.doctor_id === doctorId);
        if (found) setDoctor(found);
        else setError('Doctor not found');
        setLoading(false);
      })
      .catch(() => { setError('Failed to load doctor info'); setLoading(false); });
  }, [doctorId]);

  // Fetch slots when date changes (REQ-15: with local cache)
  useEffect(() => {
    if (!selectedDate || !doctorId) return;
    
    // REQ-15: Try to get cached schedule first
    const cached = getCachedSchedule(doctorId, selectedDate);
    if (cached) {
      setAvailableSlots(cached);
      return;
    }

    // Fetch from API if cache miss
    fetch(`${BASE_URL}/schedules/${doctorId}/slots?date=${selectedDate}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(slots => {
        setAvailableSlots(slots);
        // REQ-15: Cache the fetched schedule
        cacheSchedule(doctorId, selectedDate, slots);
      })
      .catch(err => {
        console.error('[REQ-15] Failed to fetch schedule, using cached data if available:', err);
        setAvailableSlots([]);
      });
  }, [doctorId, selectedDate]);

  // Set default date
  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) setSelectedDate(availableDates[0]);
  }, [availableDates]);

  const filteredSlots = useMemo(() =>
    availableSlots.filter(s =>
      s.start_time.toLowerCase().includes(searchQuery.toLowerCase())
    ), [availableSlots, searchQuery]);

  const formatDate = (dateStr) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

  const handleBooking = async () => {
    if (!selectedSlot) { alert('Please select a time slot'); return; }

    // REQ-5: Re-validate slot availability before navigating to confirmation
    // This catches cases where another user booked the slot while this user was deciding
    try {
      const freshSlots = await fetch(
        `${BASE_URL}/schedules/${doctorId}/slots?date=${selectedDate}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      ).then(r => r.json());

      const stillAvailable = Array.isArray(freshSlots) && freshSlots.some(s => s.schedule_id === selectedSlot);
      if (!stillAvailable) {
        // Refresh the displayed slots and clear selection
        setAvailableSlots(freshSlots);
        setSelectedSlot(null);
        alert('⚠️ This slot was just booked by someone else. Please select another time.');
        return;
      }
      // Update displayed slots with fresh data
      setAvailableSlots(freshSlots);
    } catch {
      // Network error — proceed anyway; server will enforce the constraint
    }

    const slot = availableSlots.find(s => s.schedule_id === selectedSlot);
    navigate('/booking-confirmation', {
      state: {
        appointment: {
          id: Date.now(),
          doctorId: doctor.doctor_id,
          doctorName: doctor.name,
          specialty: doctor.specialty,
          avgConsultationDuration: doctor.avg_consultation_duration || 15,
          schedule_id: slot.schedule_id,
          date: selectedDate,
          time: slot.start_time,
          consultationFee: '$50',
          rating: 4.8,
          status: 'scheduled',
          bookedOn: new Date().toISOString(),
        },
      },
    });
  };

  if (loading) return <div className="booking-container"><p>Loading...</p></div>;
  if (error || !doctor) return (
    <div className="booking-container">
      <div className="error-state">
        <h2>{error || 'Doctor not found'}</h2>
        <button onClick={() => navigate('/doctors')} className="back-btn">Back to Doctors</button>
      </div>
    </div>
  );

  return (
    <div className="booking-container">
      <section className="booking-hero">
        <h1>Book Your Appointment</h1>
        <p>Select your preferred date and time</p>
      </section>

      <section className="booking-section">
        <div className="booking-content">
          {/* Doctor Panel */}
          <div className="doctor-panel">
            <h2>Doctor Information</h2>
            <div className="doctor-details">
              <div className="doctor-avatar">👨‍⚕️</div>
              <div className="doctor-info-content">
                <h3>{doctor.name}</h3>
                <p className="specialty">{doctor.specialty}</p>
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <div className="booking-form-panel">
            {/* Date Selection */}
            <div className="form-section">
              <h3>Select Date</h3>
              <div className="date-picker">
                {availableDates.map(date => (
                  <button
                    key={date}
                    className={`date-btn ${selectedDate === date ? 'active' : ''}`}
                    onClick={() => { setSelectedDate(date); setSelectedSlot(null); setSearchQuery(''); }}
                  >
                    <span className="date-label">{formatDate(date).split(',')[0]}</span>
                    <span className="date-value">{formatDate(date).split(',').slice(1).join(',')}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="form-section">
              <h3>Search Time Slots</h3>
              <div className="search-slot-wrapper">
                <input
                  type="text"
                  placeholder="Search time (e.g., 09:00)..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="slot-search-input"
                />
                <span className="search-slot-icon">🔍</span>
              </div>
            </div>

            {/* Slots */}
            <div className="form-section">
              <h3>Available Time Slots</h3>
              {doctor.avg_consultation_duration && (
                <p className="slot-duration-note">
                  ⏱ Avg consultation: {doctor.avg_consultation_duration} min per patient
                </p>
              )}
              <div className="slots-grid">
                {filteredSlots.length > 0 ? filteredSlots.map((slot, idx) => {
                  // REQ-8: Estimated wait = position in list × avg consultation duration
                  const waitMins = idx * (doctor.avg_consultation_duration || 15);
                  return (
                    <button
                      key={slot.schedule_id}
                      className={`slot-btn ${selectedSlot === slot.schedule_id ? 'selected' : ''}`}
                      onClick={() => setSelectedSlot(slot.schedule_id)}
                    >
                      <span className="slot-time">{slot.start_time}</span>
                      <span className="slot-wait">~{waitMins} min wait</span>
                    </button>
                  );
                }) : (
                  <p className="no-slots">
                    {searchQuery ? 'No slots match your search' : 'No available slots for this date'}
                  </p>
                )}
              </div>
            </div>

            {/* Summary */}
            {selectedSlot && (() => {
              const slot = availableSlots.find(s => s.schedule_id === selectedSlot);
              return (
                <div className="slot-summary">
                  <h3>Appointment Summary</h3>
                  <div className="summary-item"><span>Doctor:</span><strong>{doctor.name}</strong></div>
                  <div className="summary-item"><span>Date:</span><strong>{formatDate(selectedDate)}</strong></div>
                  <div className="summary-item"><span>Time:</span><strong>{slot?.start_time}</strong></div>
                </div>
              );
            })()}

            {/* Actions */}
            <div className="action-buttons">
              <button onClick={() => navigate('/doctors')} className="cancel-btn">Back to Doctors</button>
              <button
                onClick={handleBooking}
                className={`confirm-btn ${!selectedSlot ? 'disabled' : ''}`}
                disabled={!selectedSlot}
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
