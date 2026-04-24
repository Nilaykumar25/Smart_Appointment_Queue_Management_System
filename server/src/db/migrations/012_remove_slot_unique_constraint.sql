-- Migration 012: Remove unique constraint on schedule slots
-- Allows multiple patients to book the same time slot (up to max_capacity)

-- Remove the constraint that prevents multiple bookings per slot
ALTER TABLE appointments
  DROP CONSTRAINT IF EXISTS appointments_doctor_id_schedule_id_key;

-- Add comment for clarity
COMMENT ON TABLE appointments IS 'Multiple patients can now book the same schedule slot (up to max_capacity limit)';