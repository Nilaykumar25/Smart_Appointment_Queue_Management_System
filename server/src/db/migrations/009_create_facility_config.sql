-- ═══════════════════════════════════════════════════════════════════════════════════════
-- Migration 009: Facility Configuration Table
-- ═══════════════════════════════════════════════════════════════════════════════════════
-- Implements: REQ-9 — Facility operating hours configuration
-- See SRS Section 4.4 — Clinic Schedule Management
--
-- Facility Hours Mapping:
--   - One row per day of week (Monday through Sunday)
--   - Each row defines facility operating hours for that day
--   - All appointments must fall within facility hours
--   - Doctor schedules must be nested within facility hours
--   - Admin can configure different hours for different days
--
-- Usage:
--   - On page load: Admin UI fetches all 7 days of facility config
--   - Admin selects a day and sets start/end times
--   - Save persists to database
--   - All appointment scheduling respects these bounds
-- ═══════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE facility_config (
    config_id      VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week    INTEGER     NOT NULL UNIQUE CHECK (day_of_week >= 0 AND day_of_week <= 6),
                   -- 0 = Monday, 1 = Tuesday, ..., 6 = Sunday
    start_time     TIME        NOT NULL,
                   -- Facility opens at this time (e.g., 08:00)
    end_time       TIME        NOT NULL,
                   -- Facility closes at this time (e.g., 18:00)
    is_operational BOOLEAN     NOT NULL DEFAULT TRUE,
                   -- FALSE = holiday/closed for this day
    created_at     TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- Initialize with default 9 AM to 5 PM for all days (Monday-Sunday)
INSERT INTO facility_config (day_of_week, start_time, end_time, is_operational)
VALUES
    (0, '09:00'::TIME, '17:00'::TIME, TRUE),   -- Monday
    (1, '09:00'::TIME, '17:00'::TIME, TRUE),   -- Tuesday
    (2, '09:00'::TIME, '17:00'::TIME, TRUE),   -- Wednesday
    (3, '09:00'::TIME, '17:00'::TIME, TRUE),   -- Thursday
    (4, '09:00'::TIME, '17:00'::TIME, TRUE),   -- Friday
    (5, '09:00'::TIME, '17:00'::TIME, FALSE),  -- Saturday (closed)
    (6, '09:00'::TIME, '17:00'::TIME, FALSE)   -- Sunday (closed)
ON CONFLICT (day_of_week) DO NOTHING;
