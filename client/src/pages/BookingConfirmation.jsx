/**
 * ========================================
 * BOOKING CONFIRMATION PAGE COMPONENT
 * ========================================
 * 
 * FILE LOCATION: client/src/pages/BookingConfirmation.jsx
 * Route: /booking-confirmation
 * Access: Authenticated users who completed appointment selection
 * 
 * PURPOSE:
 * - Final review of appointment details before saving
 * - Display complete appointment summary (doctor, date, time, fee)
 * - Collect patient information (reason for visit, medical history)
 * - Show terms and conditions
 * - Allow user to confirm or go back to modify selection
 * - Save verified appointment to localStorage and database
 * 
 * FEATURES:
 * ✓ Appointment summary with doctor info and timing
 * ✓ Appointment details verification section
 * ✓ Patient information collection form
 * ✓ Terms and conditions agreement checkbox
 * ✓ Cancellation policy information
 * ✓ Confirm appointment button
 * ✓ Go back to edit selection option
 * ✓ Success confirmation message
 * 
 * STATE MANAGEMENT:
 * - pendingAppointment: Appointment data from navigation state
 * - formData: Patient information (reason, medical history, etc.)
 * - isChecked: Terms & conditions checkbox state
 * - isLoading: Submission loading state
 * - confirmationMessage: Success message display
 * 
 * FLOW:
 * BookAppointment → BookingConfirmation → Dashboard
 *
 * CONNECTED TO:
 * - BookAppointment.jsx (previous step - slot selection)
 * - Dashboard.jsx (next step - view appointments)
 * - AuthContext (user information)
 * - localStorage (persistent storage)
 * ========================================
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BookingConfirmation = () => {
  // ===========================
  // SECTION 1: HOOKS & CONTEXT
  // ===========================
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // ===========================
  // SECTION 2: STATE MANAGEMENT
  // ===========================
  
  // Appointment data passed from BookAppointment component
  const [pendingAppointment, setPendingAppointment] = useState(null);

  // Patient information form data
  const [formData, setFormData] = useState({
    reasonForVisit: '',
    medicalHistory: '',
    allergies: '',
    currentMedications: '',
  });

  // Terms and conditions agreement state
  const [isChecked, setIsChecked] = useState(false);

  // Loading state for submission
  const [isLoading, setIsLoading] = useState(false);

  // Confirmation message state
  const [confirmationMessage, setConfirmationMessage] = useState('');

  // ===========================
  // SECTION 3: EFFECTS
  // ===========================

  /**
   * EFFECT: Initialize component with appointment data
   * Retrieves appointment data from navigation state
   * Redirects to home if no appointment data (security check)
   */
  useEffect(() => {
    // Check if appointment data was passed from BookAppointment
    if (location.state?.appointment) {
      setPendingAppointment(location.state.appointment);
    } else {
      // Redirect to home if no data (user navigated directly)
      navigate('/');
    }
  }, [location, navigate]);

  // ===========================
  // SECTION 4: EVENT HANDLERS
  // ===========================

  /**
   * HANDLER: Handle form input changes
   * Updates formData state as user types in input fields
   * 
   * @param {Event} e - Form input change event
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  /**
   * HANDLER: Handle checkbox toggle for terms agreement
   * Updates isChecked state when user checks/unchecks checkbox
   * 
   * @param {Event} e - Checkbox change event
   */
  const handleCheckboxChange = (e) => {
    setIsChecked(e.target.checked);
  };

  /**
   * HANDLER: Navigate back to previous booking step
   * Allows user to modify appointment selection
   * Passes current appointment data to preserve selection
   */
  const handleGoBack = () => {
    navigate(-1, { state: { appointment: pendingAppointment } });
  };

  /**
   * HANDLER: Confirm and save appointment
   * Validates form, saves to localStorage, shows success message
   * Redirects to dashboard after confirmation
   * 
   * Main booking confirmation action
   */
  const handleConfirmBooking = async () => {
    // Validation: Check if terms are agreed
    if (!isChecked) {
      alert('Please agree to the terms and conditions to proceed');
      return;
    }

    // Validation: Check if reason for visit is provided
    if (!formData.reasonForVisit.trim()) {
      alert('Please provide a reason for your visit');
      return;
    }

    setIsLoading(true);

    try {
      // ===== APPOINTMENT SAVING LOGIC =====
      // Create final appointment object with all details
      const completeAppointment = {
        ...pendingAppointment,
        // Patient information collected from form
        patientInfo: {
          reasonForVisit: formData.reasonForVisit,
          medicalHistory: formData.medicalHistory,
          allergies: formData.allergies,
          currentMedications: formData.currentMedications,
        },
        // Metadata
        bookedOn: new Date().toISOString(),
        status: 'confirmed',
        patientId: user?.id,
      };

      // Save to localStorage (temporary storage)
      const existingAppointments = localStorage.getItem('userAppointments');
      const appointments = existingAppointments ? JSON.parse(existingAppointments) : [];
      appointments.push(completeAppointment);
      localStorage.setItem('userAppointments', JSON.stringify(appointments));

      // REQ-7 & REQ-8: Generate Queue Data (Queue Position and Estimated Wait Time)
      // When appointment is booked, automatically add patient to queue
      const queuePosition = Math.floor(Math.random() * 10) + 1; // Random position 1-10
      const estimatedWaitTime = queuePosition * 5; // Each position = ~5 minutes
      
      const queueData = {
        position: queuePosition,
        estimatedWaitTime: estimatedWaitTime
      };
      localStorage.setItem('userQueueData', JSON.stringify(queueData));

      // TODO: FUTURE - Send to backend API
      // const response = await fetch('/api/appointments/create', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(completeAppointment)
      // });

      // Show success message
      setConfirmationMessage('✅ Appointment booked successfully!');

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Error confirming appointment:', error);
      alert('An error occurred while booking your appointment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ===========================
  // SECTION 5: RENDER LOGIC
  // ===========================

  // Show loading state while data is loading
  if (!pendingAppointment) {
    return (
      <div className="confirmation-container">
        <div className="loading-state">
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="confirmation-container">
      {/* ===========================
          PART 1: PAGE HEADER
          =========================== */}
      <section className="confirmation-header">
        <h1>📋 Confirm Your Appointment</h1>
        <p>Please review your appointment details before confirming your booking.</p>
      </section>

      {/* ===========================
          PART 2: APPOINTMENT SUMMARY
          =========================== */}
      <section className="confirmation-content">
        {/* ===== APPOINTMENT SUMMARY CARD ===== */}
        {/* Displays doctor info and appointment timing */}
        <div className="summary-section">
          <h2 className="section-title">📅 Appointment Summary</h2>
          
          <div className="summary-card">
            {/* Doctor Information */}
            <div className="summary-row">
              <div className="summary-label">Doctor Name</div>
              <div className="summary-value">{pendingAppointment.doctorName}</div>
            </div>

            {/* Specialty */}
            <div className="summary-row">
              <div className="summary-label">Specialty</div>
              <div className="summary-value">{pendingAppointment.specialty}</div>
            </div>

            {/* Doctor Rating */}
            <div className="summary-row">
              <div className="summary-label">Doctor Rating</div>
              <div className="summary-value">
                ⭐ {pendingAppointment.rating || '4.8'}/5.0
              </div>
            </div>

            {/* Appointment Date */}
            <div className="summary-row border-top">
              <div className="summary-label">📅 Appointment Date</div>
              <div className="summary-value">
                {new Date(pendingAppointment.date + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>

            {/* Appointment Time */}
            <div className="summary-row">
              <div className="summary-label">⏰ Appointment Time</div>
              <div className="summary-value">{pendingAppointment.time}</div>
            </div>

            {/* Consultation Fee */}
            <div className="summary-row border-top">
              <div className="summary-label">💰 Consultation Fee</div>
              <div className="summary-value">{pendingAppointment.consultationFee}</div>
            </div>
          </div>
        </div>

        {/* ===== PATIENT INFORMATION FORM ===== */}
        {/* Collects additional patient information for the appointment */}
        <div className="patient-info-section">
          <h2 className="section-title">🏥 Patient Information</h2>
          
          <form className="patient-form">
            {/* Reason for Visit Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="reasonForVisit">
                Reason for Visit <span className="required">*</span>
              </label>
              <textarea
                id="reasonForVisit"
                name="reasonForVisit"
                className="form-textarea"
                placeholder="Please describe your symptoms or concerns..."
                value={formData.reasonForVisit}
                onChange={handleInputChange}
                rows="4"
              />
              <p className="form-hint">Describe your symptoms or reason for visiting</p>
            </div>

            {/* Medical History Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="medicalHistory">
                Medical History
              </label>
              <textarea
                id="medicalHistory"
                name="medicalHistory"
                className="form-textarea"
                placeholder="Any previous medical conditions or surgeries..."
                value={formData.medicalHistory}
                onChange={handleInputChange}
                rows="3"
              />
              <p className="form-hint">List any previous conditions, surgeries, or treatments</p>
            </div>

            {/* Allergies Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="allergies">
                Allergies
              </label>
              <input
                id="allergies"
                name="allergies"
                type="text"
                className="form-input"
                placeholder="e.g., Penicillin, Latex, Nuts..."
                value={formData.allergies}
                onChange={handleInputChange}
              />
              <p className="form-hint">List any known allergies (medications, food, etc.)</p>
            </div>

            {/* Current Medications Field */}
            <div className="form-group">
              <label className="form-label" htmlFor="currentMedications">
                Current Medications
              </label>
              <textarea
                id="currentMedications"
                name="currentMedications"
                className="form-textarea"
                placeholder="List all medications you are currently taking..."
                value={formData.currentMedications}
                onChange={handleInputChange}
                rows="3"
              />
              <p className="form-hint">Include dosage and frequency for each medication</p>
            </div>
          </form>
        </div>

        {/* ===== TERMS AND CANCELLATION POLICY ===== */}
        {/* Displays policies and requires agreement */}
        <div className="policies-section">
          <h2 className="section-title">📜 Terms & Conditions</h2>

          {/* Cancellation Policy Card */}
          <div className="policy-card">
            <h3 className="policy-subtitle">🚫 Cancellation Policy</h3>
            <ul className="policy-list">
              <li>Free cancellation up to 24 hours before appointment</li>
              <li>50% refund if cancelled 12-24 hours before</li>
              <li>No refund if cancelled less than 12 hours before</li>
              <li>No-show will be charged full consultation fee</li>
            </ul>
          </div>

          {/* Privacy Policy Card */}
          <div className="policy-card">
            <h3 className="policy-subtitle">🔒 Privacy & Data Protection</h3>
            <ul className="policy-list">
              <li>Your medical information is confidential and secure</li>
              <li>We comply with HIPAA and data protection regulations</li>
              <li>Your data will not be shared without consent</li>
              <li>You can request your medical records at any time</li>
            </ul>
          </div>

          {/* Appointment Terms Card */}
          <div className="policy-card">
            <h3 className="policy-subtitle">📋 Appointment Terms</h3>
            <ul className="policy-list">
              <li>Please arrive 10 minutes early for your appointment</li>
              <li>Bring valid ID and insurance information if applicable</li>
              <li>Appointment reminders will be sent 24 hours in advance</li>
              <li>Doctor may reschedule if delayed more than 15 minutes</li>
            </ul>
          </div>

          {/* Agreement Checkbox */}
          <div className="agreement-checkbox">
            <input
              id="termsAgree"
              type="checkbox"
              checked={isChecked}
              onChange={handleCheckboxChange}
            />
            <label htmlFor="termsAgree">
              I have read and agree to the terms and conditions, cancellation policy, and privacy policy
            </label>
          </div>
        </div>
      </section>

      {/* ===========================
          PART 3: ACTION BUTTONS
          =========================== */}
      <section className="confirmation-actions">
        {/* Success Message Display */}
        {confirmationMessage && (
          <div className="success-message">
            {confirmationMessage}
          </div>
        )}

        {/* Button Container */}
        <div className="button-group">
          {/* Go Back Button */}
          <button
            className="btn-secondary"
            onClick={handleGoBack}
            disabled={isLoading}
          >
            🔙 Go Back & Edit
          </button>

          {/* Confirm Booking Button */}
          <button
            className="btn-primary"
            onClick={handleConfirmBooking}
            disabled={isLoading || !isChecked}
          >
            {isLoading ? '⏳ Processing...' : '✅ Confirm Booking'}
          </button>
        </div>
      </section>
    </div>
  );
};

export default BookingConfirmation;
