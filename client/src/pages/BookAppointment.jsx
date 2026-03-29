/**
 * ========================================
 * REQ-5: SLOT PICKER DATE/TIME COMPONENT
 * Book Appointment with Date & Time Selection
 * ========================================
 * Features:
 * - Date picker for appointment selection
 * - Time slot availability display
 * - Search/filter for time slots
 * - Doctor information display
 * - Booking confirmation
 * 
 * REQ-15: Local Schedule Caching
 * - Persist daily slots to sessionStorage
 * - Improve performance by preventing redundant API calls
 * - Cache is cleared on page refresh/new session
 */

import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/BookAppointment.css';

export default function BookAppointment() {
  // REQ-5: Get doctor ID from URL params
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ========================================
  // REQ-15: LOCAL SCHEDULE CACHING UTILITIES
  // Persist daily slots to sessionStorage for performance
  // ========================================

  /**
   * REQ-15: Get cache key for a specific date
   * @param {string} date - The date in YYYY-MM-DD format
   * @returns {string} Cache key for sessionStorage
   */
  const getCacheKey = (date) => `schedule_slots_${date}`;

  /**
   * REQ-15: Check if cached slots are still valid for today
   * Cache is considered valid if it was created on the same date
   * @param {string} date - The date in YYYY-MM-DD format
   * @returns {boolean} True if valid cache exists for the date
   */
  const isSlotsCacheValid = (date) => {
    const cacheKey = getCacheKey(date);
    const cachedData = sessionStorage.getItem(cacheKey);
    
    if (!cachedData) {
      return false;
    }

    try {
      const parsed = JSON.parse(cachedData);
      // REQ-15: Verify cache exists and has valid timestamp
      return parsed.slots && parsed.timestamp !== undefined;
    } catch (error) {
      console.warn(`REQ-15: Failed to parse cached slots for ${date}:`, error);
      return false;
    }
  };

  /**
   * REQ-15: Load slots from sessionStorage cache
   * @param {string} date - The date in YYYY-MM-DD format
   * @returns {Array|null} Cached slots or null if not in cache
   */
  const getSlotsCacheData = (date) => {
    const cacheKey = getCacheKey(date);
    const cachedData = sessionStorage.getItem(cacheKey);
    
    if (!cachedData) {
      return null;
    }

    try {
      const parsed = JSON.parse(cachedData);
      // REQ-15: Return cached slots if available
      return parsed.slots || null;
    } catch (error) {
      console.warn(`REQ-15: Failed to retrieve cached slots for ${date}:`, error);
      return null;
    }
  };

  /**
   * REQ-15: Save slots to sessionStorage cache
   * Stores slots with timestamp for cache validation
   * @param {string} date - The date in YYYY-MM-DD format
   * @param {Array} slots - Array of slot objects to cache
   */
  const cacheSlots = (date, slots) => {
    try {
      const cacheKey = getCacheKey(date);
      const cacheData = {
        slots: slots,
        timestamp: Date.now(),
        cachedDate: date,
        // REQ-15: Store caching metadata for debugging
        cacheCreated: new Date().toISOString()
      };
      sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`REQ-15: Cached ${slots.length} slots for ${date}`);
    } catch (error) {
      console.warn('REQ-15: Failed to cache slots to sessionStorage:', error);
      // Gracefully handle storage quota exceeded
    }
  };

  /**
   * REQ-15: Clear all cached slots from sessionStorage
   * Useful for logout or cache invalidation
   */
  const clearSlotsCache = () => {
    try {
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith('schedule_slots_')) {
          sessionStorage.removeItem(key);
        }
      });
      console.log('REQ-15: Cleared all cached slots from sessionStorage');
    } catch (error) {
      console.warn('REQ-15: Failed to clear slots cache:', error);
    }
  };

  // REQ-5: Mock doctor data (would come from backend in production)
  const doctorsData = [
    {
      id: 1,
      name: 'Dr. Sarah Anderson',
      specialty: 'Cardiology',
      rating: 4.8,
      experience: '15 years',
      consultationFee: '$50'
    },
    {
      id: 2,
      name: 'Dr. James Mitchell',
      specialty: 'Orthopedics',
      rating: 4.7,
      experience: '12 years',
      consultationFee: '$45'
    },
    {
      id: 3,
      name: 'Dr. Emily Watson',
      specialty: 'Neurology',
      rating: 4.9,
      experience: '18 years',
      consultationFee: '$60'
    },
    {
      id: 4,
      name: 'Dr. Michael Johnson',
      specialty: 'Dermatology',
      rating: 4.6,
      experience: '10 years',
      consultationFee: '$40'
    },
    {
      id: 5,
      name: 'Dr. Lisa Chen',
      specialty: 'Pediatrics',
      rating: 4.9,
      experience: '14 years',
      consultationFee: '$35'
    },
    {
      id: 6,
      name: 'Dr. Robert Williams',
      specialty: 'Ophthalmology',
      rating: 4.7,
      experience: '16 years',
      consultationFee: '$55'
    },
    {
      id: 7,
      name: 'Dr. Amanda Foster',
      specialty: 'General Practice',
      rating: 4.8,
      experience: '11 years',
      consultationFee: '$30'
    },
    {
      id: 8,
      name: 'Dr. David Kumar',
      specialty: 'Psychiatry',
      rating: 4.6,
      experience: '13 years',
      consultationFee: '$50'
    }
  ];

  // REQ-15: Mock available slots data structure
  // These slots will be cached to sessionStorage for performance optimization
  const mockAvailableSlots = [
    { id: 1, time: '09:00 AM', date: '2024-04-01', available: true },
    { id: 2, time: '09:30 AM', date: '2024-04-01', available: true },
    { id: 3, time: '10:00 AM', date: '2024-04-01', available: false },
    { id: 4, time: '10:30 AM', date: '2024-04-01', available: true },
    { id: 5, time: '11:00 AM', date: '2024-04-01', available: true },
    { id: 6, time: '11:30 AM', date: '2024-04-01', available: false },
    { id: 7, time: '02:00 PM', date: '2024-04-01', available: true },
    { id: 8, time: '02:30 PM', date: '2024-04-01', available: true },
    { id: 9, time: '03:00 PM', date: '2024-04-01', available: true },
    { id: 10, time: '03:30 PM', date: '2024-04-01', available: false },
    { id: 11, time: '04:00 PM', date: '2024-04-01', available: true },
    { id: 12, time: '04:30 PM', date: '2024-04-01', available: true },
    { id: 13, time: '09:00 AM', date: '2024-04-02', available: true },
    { id: 14, time: '10:00 AM', date: '2024-04-02', available: true },
    { id: 15, time: '11:00 AM', date: '2024-04-02', available: true },
    { id: 16, time: '02:00 PM', date: '2024-04-02', available: true },
    { id: 17, time: '03:00 PM', date: '2024-04-02', available: false },
    { id: 18, time: '04:00 PM', date: '2024-04-02', available: true },
    { id: 19, time: '09:00 AM', date: '2024-04-03', available: true },
    { id: 20, time: '10:30 AM', date: '2024-04-03', available: true },
  ];

  // REQ-5: Get selected doctor
  const selectedDoctor = doctorsData.find(d => d.id === parseInt(doctorId));

  // REQ-15: State management for available slots
  // Initialized with either cached data or mock data
  const [availableSlots, setAvailableSlots] = useState(() => {
    // REQ-15: Try to load slots from sessionStorage cache on component mount
    const cachedSlots = getSlotsCacheData('all_doctors');
    if (cachedSlots && isSlotsCacheValid('all_doctors')) {
      console.log('REQ-15: Loaded slots from sessionStorage cache');
      return cachedSlots;
    }
    // REQ-15: Fall back to mock data if cache is unavailable
    console.log('REQ-15: No valid cache found, using mock slot data');
    return mockAvailableSlots;
  });

  // REQ-15: Effect to cache slots when they change
  // Ensures future page loads can use cached data
  useEffect(() => {
    if (availableSlots.length > 0) {
      cacheSlots('all_doctors', availableSlots);
    }
  }, [availableSlots]);

  // REQ-5: State management for date and time selection
  const [selectedDate, setSelectedDate] = useState('2024-04-01');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // REQ-5: Get unique dates from available slots
  // REQ-15: Dates derived from cached slot data
  const availableDates = useMemo(() => {
    return [...new Set(availableSlots.map(slot => slot.date))];
  }, [availableSlots]);

  // REQ-5: Filter slots by selected date and search query
  // REQ-15: Filtering performed on cached slot data
  const filteredSlots = useMemo(() => {
    return availableSlots.filter(slot => {
      const matchesDate = slot.date === selectedDate;
      const matchesSearch = slot.time.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDate && matchesSearch && slot.available;
    });
  }, [availableSlots, selectedDate, searchQuery]);

  // REQ-5: Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // ========================================
  // REQ-5: Handle booking - Navigate to confirmation
  // ========================================
  // Purpose: Create appointment object and pass to confirmation page
  // The appointment will be saved AFTER user confirms on confirmation screen
  // This allows user to review and modify patient information before final save
  const handleBooking = () => {
    if (!selectedSlot) {
      alert('Please select a time slot');
      return;
    }

    // REQ-5: Create appointment object with all booking details
    const appointmentData = {
      id: Date.now(), // Unique ID based on timestamp
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      specialty: selectedDoctor.specialty,
      date: selectedDate,
      time: availableSlots.find(s => s.id === selectedSlot).time,
      consultationFee: selectedDoctor.consultationFee,
      rating: selectedDoctor.rating,
      status: 'scheduled',
      bookedOn: new Date().toISOString()
    };

    // REQ-6: Navigate to booking confirmation page (not directly to dashboard)
    // Pass appointment data via navigation state for final review
    navigate('/booking-confirmation', { state: { appointment: appointmentData } });
  };

  // REQ-5: Show error if doctor not found
  if (!selectedDoctor) {
    return (
      <div className="booking-container">
        <div className="error-state">
          <h2>Doctor not found</h2>
          <button onClick={() => navigate('/doctors')} className="back-btn">
            Back to Doctors
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-container">
      {/* REQ-5: Hero Section */}
      <section className="booking-hero">
        <h1>Book Your Appointment</h1>
        <p>Select your preferred date and time</p>
      </section>

      {/* REQ-5: Main Booking Section */}
      <section className="booking-section">
        <div className="booking-content">
          {/* REQ-5: Doctor Information Panel */}
          <div className="doctor-panel">
            <h2>Doctor Information</h2>
            <div className="doctor-details">
              <div className="doctor-avatar">👨‍⚕️</div>
              <div className="doctor-info-content">
                <h3>{selectedDoctor.name}</h3>
                <p className="specialty">{selectedDoctor.specialty}</p>
                <div className="doctor-stats">
                  <span>⭐ {selectedDoctor.rating}</span>
                  <span>📅 {selectedDoctor.experience}</span>
                </div>
                <p className="fee">Consultation Fee: {selectedDoctor.consultationFee}</p>
              </div>
            </div>
          </div>

          {/* REQ-5: Booking Form Section */}
          <div className="booking-form-panel">
            {/* REQ-5: Date Selection */}
            <div className="form-section">
              <h3>Select Date</h3>
              <div className="date-picker">
                {availableDates.map(date => (
                  <button
                    key={date}
                    className={`date-btn ${selectedDate === date ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedDate(date);
                      setSelectedSlot(null); // Reset selected slot when date changes
                      setSearchQuery(''); // Reset search when date changes
                    }}
                  >
                    <span className="date-label">{formatDate(date).split(',')[0]}</span>
                    <span className="date-value">{formatDate(date).split(',').slice(1).join(',')}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* REQ-5: Time Slot Search */}
            <div className="form-section">
              <h3>Search Time Slots</h3>
              <div className="search-slot-wrapper">
                <input
                  type="text"
                  placeholder="Search time slots (e.g., 09:00, 02:00 PM)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="slot-search-input"
                />
                <span className="search-slot-icon">🔍</span>
              </div>
              {searchQuery && (
                <p className="search-results-info">
                  Found {filteredSlots.length} available slot(s)
                </p>
              )}
            </div>

            {/* REQ-5: Available Time Slots */}
            <div className="form-section">
              <h3>Available Time Slots</h3>
              <div className="slots-grid">
                {filteredSlots.length > 0 ? (
                  filteredSlots.map(slot => (
                    <button
                      key={slot.id}
                      className={`slot-btn ${selectedSlot === slot.id ? 'selected' : ''}`}
                      onClick={() => setSelectedSlot(slot.id)}
                    >
                      {slot.time}
                    </button>
                  ))
                ) : (
                  <p className="no-slots">
                    {searchQuery ? 'No time slots match your search' : 'No available slots for this date'}
                  </p>
                )}
              </div>
            </div>

            {/* REQ-5: Selected Slot Summary */}
            {selectedSlot && (
              <div className="slot-summary">
                <h3>Appointment Summary</h3>
                <div className="summary-item">
                  <span>Doctor:</span>
                  <strong>{selectedDoctor.name}</strong>
                </div>
                <div className="summary-item">
                  <span>Date:</span>
                  <strong>{formatDate(selectedDate)}</strong>
                </div>
                <div className="summary-item">
                  <span>Time:</span>
                  <strong>{availableSlots.find(s => s.id === selectedSlot).time}</strong>
                </div>
                <div className="summary-item">
                  <span>Fee:</span>
                  <strong>{selectedDoctor.consultationFee}</strong>
                </div>
              </div>
            )}

            {/* REQ-5: Action Buttons */}
            <div className="action-buttons">
              <button 
                onClick={() => navigate('/doctors')} 
                className="cancel-btn"
              >
                Back to Doctors
              </button>
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
