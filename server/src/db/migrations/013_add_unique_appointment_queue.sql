-- Migration 013: Add unique constraint on appointment_id in queue table
-- Prevents duplicate queue entries for the same appointment

-- First, remove any existing duplicates (should be clean now)
DELETE FROM queue 
WHERE queue_id NOT IN (
    SELECT MIN(queue_id) 
    FROM queue 
    GROUP BY appointment_id
);

-- Add unique constraint
ALTER TABLE queue 
ADD CONSTRAINT queue_appointment_id_unique UNIQUE (appointment_id);