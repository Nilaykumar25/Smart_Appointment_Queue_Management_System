-- Migration 005: Queue table
-- Implements: REQ-7 (real-time queue), REQ-8 (wait time)

CREATE TABLE queue (
    queue_id            VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id      VARCHAR(36) NOT NULL REFERENCES appointments(appointment_id),
    queue_position      INTEGER     NOT NULL,
    estimated_wait_time INTEGER     NOT NULL DEFAULT 0
);
