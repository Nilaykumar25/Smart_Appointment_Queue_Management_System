-- Migration 003: Schedules table
-- Implements: REQ-9 (define daily slots), REQ-10 (blackout dates)

CREATE TABLE schedules (
    schedule_id    VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id      VARCHAR(36) NOT NULL REFERENCES doctors(doctor_id),
    date           DATE        NOT NULL,
    start_time     TIME        NOT NULL,
    end_time       TIME        NOT NULL,
    slot_duration  INTEGER     NOT NULL,
    is_blackout    BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMP   NOT NULL DEFAULT NOW()
);
