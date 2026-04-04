/**
 * ========================================
 * RESCHEDULE AND CANCEL COMPONENT
 * REQ-6: Reschedule and Cancel UI with Deadline Validation
 * ========================================
 * 
 * PURPOSE:
 * Provides comprehensive UI for rescheduling and canceling appointments
 * with deadline validation to ensure patients cannot reschedule/cancel
 * within a minimum timeframe (default: 24 hours) of their appointment.
 * 
 * FEATURES:
 * ✓ Modal dialog for reschedule/cancel operations
 * ✓ Deadline validation (cannot cancel/reschedule < 24 hours before)
 * ✓ Time remaining counter
 * ✓ Reschedule to available time slots
 * ✓ Cancellation reason collection
 * ✓ Confirmation dialogs with action review
 * ✓ Proper error handling and user feedback
 * 
 * PROPS:
 * - appointment: Appointment object with date, time, doctorName, etc.
 * - isOpen: Boolean to show/hide modal
 * - onClose: Callback when modal is closed
 * - onReschedule: Callback function when appointment is rescheduled
 * - onCancel: Callback function when appointment is cancelled
 * 
 * DEADLINE VALIDATION RULES:
 * - Minimum 24 hours required before appointment to reschedule/cancel
 * - Time calculated from current moment to appointment date/time
 * - User cannot proceed if deadline has passed
 * 
 * STATE MANAGEMENT:
 * - action: Current action ('none', 'reschedule', 'cancel')
 * - timeRemaining: Hours/minutes until deadline (read-only)
 * - selectedDate: New date for rescheduling
 * - selectedTime: New time for rescheduling
 * - cancellationReason: Reason for cancellation
 * - isLoading: Form submission state
 * - error: Error message state
 * - showConfirmation: Show confirmation dialog before action
 * 
 * ========================================
 */

import React, { useState, useEffect } from 'react';
import './RescheduleCancel.css';

// REQ-6: Deadline validation constant (24 hours in milliseconds)
const CANCELLATION_DEADLINE_HOURS = 24;
const DEADLINE_MS = CANCELLATION_DEADLINE_HOURS * 60 * 60 * 1000;

const RescheduleCancel = ({ appointment, isOpen, onClose, onReschedule, onCancel }) => {
  // ===== STATE VARIABLES =====
  
  // Current action being performed: 'none', 'reschedule', or 'cancel'
  const [action, setAction] = useState('none');
  
  // REQ-6: Track time remaining until deadline (in hours and minutes)
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0 });
  
  // Flag indicating if deadline has passed (cannot reschedule/cancel)
  const [cannotProceed, setCannotProceed] = useState(false);
  
  // Reschedule form state
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  
  // Cancellation form state
  const [cancellationReason, setCancellationReason] = useState('');
  
  // Form submission states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Confirmation dialog state (user must confirm before final action)
  const [showConfirmation, setShowConfirmation] = useState(false);

  // ===== EFFECTS =====

  /**
   * Effect: Calculate and update deadline validation status
   * REQ-6: Validates that appointment is at least CANCELLATION_DEADLINE_HOURS away
   * Updates every second to provide real-time countdown
   */
  useEffect(() => {
    if (!appointment || !isOpen) return;

    // Calculate deadline timer
    const calculateDeadline = () => {
      try {
        // Parse appointment date and time into Date object
        // Format: appointment.date = "YYYY-MM-DD", appointment.time = "HH:MM"
        const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}:00`);
        const currentTime = new Date();

        // Calculate milliseconds until appointment
        const msUntilAppointment = appointmentDateTime.getTime() - currentTime.getTime();

        // REQ-6: Check if sufficient time remains for cancellation/reschedule
        // If less than 24 hours remain, user cannot proceed with changes
        if (msUntilAppointment < DEADLINE_MS) {
          setCannotProceed(true);
        } else {
          setCannotProceed(false);
        }

        // Convert remaining time to hours and minutes for display
        const msAfterDeadline = msUntilAppointment - DEADLINE_MS;
        const hoursRemaining = Math.floor(msAfterDeadline / (1000 * 60 * 60));
        const minutesRemaining = Math.floor((msAfterDeadline % (1000 * 60 * 60)) / (1000 * 60));

        setTimeRemaining({
          hours: Math.max(0, hoursRemaining),
          minutes: Math.max(0, minutesRemaining),
        });
      } catch (err) {
        console.error('Error calculating deadline:', err);
        setCannotProceed(true);
      }
    };

    // Initial calculation
    calculateDeadline();

    // Update deadline every 60 seconds (don't need second-level precision)
    const timer = setInterval(calculateDeadline, 60000);

    return () => clearInterval(timer);
  }, [appointment, isOpen]);

  // ===== HANDLER FUNCTIONS =====

  /**
   * Handler: Open reschedule action panel
   * Cannot proceed if deadline has passed (REQ-6)
   */
  const handleRescheduleClick = () => {
    setError('');
    if (cannotProceed) {
      setError('Cannot reschedule within 24 hours of appointment');
      return;
    }
    setAction('reschedule');
  };

  /**
   * Handler: Open cancel action panel
   * Cannot proceed if deadline has passed (REQ-6)
   */
  const handleCancelClick = () => {
    setError('');
    if (cannotProceed) {
      setError('Cannot cancel within 24 hours of appointment');
      return;
    }
    setAction('cancel');
  };

  /**
   * Handler: Go back to action selection
   * Clears form data and errors
   */
  const handleBackToActions = () => {
    setAction('none');
    setSelectedDate('');
    setSelectedTime('');
    setCancellationReason('');
    setError('');
    setShowConfirmation(false);
  };

  /**
   * Handler: Validate and prepare for reschedule confirmation
   * Ensures new date/time are selected
   */
  const handleRescheduleSubmit = (e) => {
    e.preventDefault();
    
    // Validation: Both date and time must be selected
    if (!selectedDate || !selectedTime) {
      setError('Please select both a date and time for your new appointment');
      return;
    }

    // Validation: New date cannot be in the past
    const newDateTime = new Date(`${selectedDate}T${selectedTime}:00`);
    if (newDateTime < new Date()) {
      setError('Cannot schedule appointment in the past');
      return;
    }

    // All validations passed, show confirmation dialog
    setShowConfirmation(true);
  };

  /**
   * Handler: Validate and prepare for cancellation confirmation
   * Ensures cancellation reason is provided
   */
  const handleCancelSubmit = (e) => {
    e.preventDefault();
    
    // Validation: Reason is optional but helpful for admin review
    // Still allow cancellation without reason, but recommend one
    if (!cancellationReason.trim()) {
      setError('Please provide a reason for cancellation');
      return;
    }

    // All validations passed, show confirmation dialog
    setShowConfirmation(true);
  };

  /**
   * Handler: Confirm and process reschedule action
   * Updates appointment with new date/time
   * Clears old appointment and queue data
   */
  const handleConfirmReschedule = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Create rescheduled appointment object with new datetime
      const rescheduledAppointment = {
        ...appointment,
        date: selectedDate,
        time: selectedTime,
        // Mark when appointment was rescheduled for audit trail
        rescheduledAt: new Date().toISOString(),
        // Track original appointment date for reference
        originalDate: appointment.date,
        originalTime: appointment.time,
      };

      // Call parent's onReschedule callback with updated appointment
      if (onReschedule) {
        await onReschedule(rescheduledAppointment);
      }

      // Close modal and reset state on success
      handleBackToActions();
      onClose();
    } catch (err) {
      console.error('Error rescheduling appointment:', err);
      setError(`Failed to reschedule appointment: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handler: Confirm and process cancellation action
   * Removes appointment from patient's list
   * Clears queue data if patient was in queue for this appointment
   */
  const handleConfirmCancel = async () => {
    setIsLoading(false);
    setError('');

    try {
      // Create cancellation record with metadata
      const cancellationRecord = {
        appointmentId: appointment.id,
        doctorName: appointment.doctorName,
        originalDate: appointment.date,
        originalTime: appointment.time,
        cancelledAt: new Date().toISOString(),
        cancellationReason: cancellationReason,
      };

      // Call parent's onCancel callback with cancellation details
      if (onCancel) {
        await onCancel(cancellationRecord);
      }

      // Close modal and reset state on success
      handleBackToActions();
      onClose();
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      setError(`Failed to cancel appointment: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== HELPER FUNCTIONS =====

  /**
   * Helper: Format date string to readable format
   * Input: "2026-03-28" → Output: "Sat, Mar 28, 2026"
   */
  const formatDisplayDate = (dateString) => {
    try {
      const date = new Date(dateString + 'T00:00:00');
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  /**
   * Helper: Generate available time slots for rescheduling
   * Returns array of time slots in 30-minute intervals
   * (09:00 AM to 05:00 PM)
   */
  const getAvailableTimeSlots = () => {
    const slots = [];
    // Generate slots from 9 AM to 5 PM in 30-minute intervals
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        slots.push(timeStr);
      }
    }
    return slots;
  };

  /**
   * Helper: Get minimum selectable date for rescheduling
   * Prevents selecting dates in the past or too close to current time
   * Returns today's date as string (YYYY-MM-DD)
   */
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // ===== RENDER CONDITIONS =====

  // Don't render if modal is not open or appointment data missing
  if (!isOpen || !appointment) return null;

  // ===== RENDER: MAIN MODAL =====
  
  return (
    <div className="reschedule-cancel-overlay" onClick={onClose}>
      <div 
        className="reschedule-cancel-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header with appointment summary */}
        <div className="modal-header">
          <h2>
            {action === 'none' ? 'Manage Appointment' : 
             action === 'reschedule' ? 'Reschedule Appointment' : 
             'Cancel Appointment'}
          </h2>
          <button 
            className="close-btn" 
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Appointment Summary Section */}
        <div className="appointment-summary">
          <h3>{appointment.doctorName}</h3>
          <div className="summary-details">
            <p>📅 <strong>{formatDisplayDate(appointment.date)}</strong></p>
            <p>⏰ <strong>{appointment.time}</strong></p>
            <p>🏥 <strong>{appointment.specialty}</strong></p>
          </div>
        </div>

        {/* REQ-6: Deadline Validation Warning - Display time remaining */}
        {!cannotProceed && (
          <div className="deadline-status safe">
            <p>
              ✓ Time Remaining: <strong>{timeRemaining.hours}h {timeRemaining.minutes}m</strong>
            </p>
            <small>You can reschedule or cancel this appointment</small>
          </div>
        )}

        {/* REQ-6: Deadline Validation Error - Display when too close to appointment */}
        {cannotProceed && (
          <div className="deadline-status warning">
            <p>
              ⚠️ Too Late to Reschedule or Cancel
            </p>
            <small>
              You must reschedule or cancel at least 24 hours before your appointment
            </small>
          </div>
        )}

        {/* Error Message Display */}
        {error && (
          <div className="error-message">
            <p>❌ {error}</p>
          </div>
        )}

        {/* SECTION 1: Action Selection (shown when action === 'none') */}
        {action === 'none' && !showConfirmation && (
          <div className="action-selection">
            <p className="section-subtitle">What would you like to do?</p>
            <div className="action-buttons">
              <button
                className="action-btn reschedule-btn"
                onClick={handleRescheduleClick}
                disabled={cannotProceed}
              >
                <span className="btn-icon">🔄</span>
                <span>Reschedule</span>
                <small>Choose a new date and time</small>
              </button>
              <button
                className="action-btn cancel-btn"
                onClick={handleCancelClick}
                disabled={cannotProceed}
              >
                <span className="btn-icon">❌</span>
                <span>Cancel</span>
                <small>Cancel this appointment</small>
              </button>
            </div>
          </div>
        )}

        {/* SECTION 2: Reschedule Form */}
        {action === 'reschedule' && !showConfirmation && (
          <form onSubmit={handleRescheduleSubmit} className="reschedule-form">
            <p className="section-subtitle">Select New Date and Time</p>
            
            {/* Date Selection */}
            <div className="form-group">
              <label htmlFor="new-date">New Date: *</label>
              <input
                id="new-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={getMinDate()}
                required
                className="form-input"
                disabled={isLoading}
              />
            </div>

            {/* Time Selection */}
            <div className="form-group">
              <label htmlFor="new-time">New Time: *</label>
              <select
                id="new-time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                required
                className="form-input"
                disabled={isLoading}
              >
                <option value="">Select a time slot</option>
                {getAvailableTimeSlots().map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleBackToActions}
                disabled={isLoading}
              >
                Back
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Review Changes'}
              </button>
            </div>
          </form>
        )}

        {/* SECTION 3: Cancel Confirmation Form */}
        {action === 'cancel' && !showConfirmation && (
          <form onSubmit={handleCancelSubmit} className="cancel-form">
            <p className="section-subtitle">Tell us why you're cancelling</p>
            
            {/* Cancellation Reason */}
            <div className="form-group">
              <label htmlFor="cancel-reason">Reason for Cancellation: *</label>
              <textarea
                id="cancel-reason"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Help us improve our service (e.g., Doctor unavailable, Schedule conflict, Found another provider)"
                rows="4"
                required
                className="form-input"
                disabled={isLoading}
              />
              <small>This helps us understand cancellation patterns and improve our service</small>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleBackToActions}
                disabled={isLoading}
              >
                Back
              </button>
              <button
                type="submit"
                className="btn btn-danger"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Continue'}
              </button>
            </div>
          </form>
        )}

        {/* SECTION 4: Confirmation Dialog */}
        {showConfirmation && (
          <div className="confirmation-dialog">
            <div className="confirmation-content">
              {action === 'reschedule' ? (
                <>
                  <h3>Confirm Reschedule</h3>
                  <div className="confirmation-details">
                    <p><strong>Original Appointment:</strong></p>
                    <p>{formatDisplayDate(appointment.date)} at {appointment.time}</p>
                    
                    <p style={{ marginTop: '1rem' }}><strong>New Appointment:</strong></p>
                    <p>{formatDisplayDate(selectedDate)} at {selectedTime}</p>
                  </div>
                  <p className="confirmation-message">
                    Are you sure you want to reschedule your appointment?
                  </p>
                </>
              ) : (
                <>
                  <h3>Confirm Cancellation</h3>
                  <div className="confirmation-details">
                    <p><strong>Appointment to Cancel:</strong></p>
                    <p>{appointment.doctorName}</p>
                    <p>{formatDisplayDate(appointment.date)} at {appointment.time}</p>
                    
                    <p style={{ marginTop: '1rem' }}><strong>Reason:</strong></p>
                    <p>{cancellationReason}</p>
                  </div>
                  <p className="confirmation-message warning">
                    Are you sure you want to cancel this appointment? This action cannot be undone.
                  </p>
                </>
              )}
            </div>

            {/* Confirmation Actions */}
            <div className="confirmation-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowConfirmation(false)}
                disabled={isLoading}
              >
                Back
              </button>
              <button
                className={`btn ${action === 'reschedule' ? 'btn-primary' : 'btn-danger'}`}
                onClick={
                  action === 'reschedule' 
                    ? handleConfirmReschedule 
                    : handleConfirmCancel
                }
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RescheduleCancel;
