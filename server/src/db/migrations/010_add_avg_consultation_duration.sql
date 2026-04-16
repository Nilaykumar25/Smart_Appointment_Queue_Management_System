-- Migration 010: Add avg_consultation_duration to doctors
-- Implements: REQ-8 — Wait time based on average consultation duration

ALTER TABLE doctors
  ADD COLUMN IF NOT EXISTS avg_consultation_duration INTEGER NOT NULL DEFAULT 15;

-- Update existing doctors with specialty-based defaults (minutes)
UPDATE doctors SET avg_consultation_duration = 20 WHERE specialty = 'Cardiology';
UPDATE doctors SET avg_consultation_duration = 25 WHERE specialty = 'Orthopedics';
UPDATE doctors SET avg_consultation_duration = 30 WHERE specialty = 'Neurology';
UPDATE doctors SET avg_consultation_duration = 15 WHERE specialty = 'Dermatology';
UPDATE doctors SET avg_consultation_duration = 20 WHERE specialty = 'Pediatrics';
UPDATE doctors SET avg_consultation_duration = 15 WHERE specialty = 'Ophthalmology';
UPDATE doctors SET avg_consultation_duration = 15 WHERE specialty = 'General Practice';
UPDATE doctors SET avg_consultation_duration = 45 WHERE specialty = 'Psychiatry';
