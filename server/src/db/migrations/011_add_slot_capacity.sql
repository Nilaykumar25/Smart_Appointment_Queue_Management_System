-- Migration 011: Add slot capacity to schedules
-- Allows multiple patients to book the same time slot (max 3)

ALTER TABLE schedules
  ADD COLUMN IF NOT EXISTS max_capacity INTEGER NOT NULL DEFAULT 3;

-- Update existing schedules to have capacity of 3
UPDATE schedules SET max_capacity = 3 WHERE max_capacity IS NULL;

-- Add comment for clarity
COMMENT ON COLUMN schedules.max_capacity IS 'Maximum number of patients that can book this time slot (default: 3)';
