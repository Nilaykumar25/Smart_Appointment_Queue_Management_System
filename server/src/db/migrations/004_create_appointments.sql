-- Migration 004: Appointments table
-- Implements: REQ-5 (prevent double booking), REQ-6 (cancellation window)

CREATE TABLE appointments (
    appointment_id VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id     VARCHAR(36)  NOT NULL REFERENCES users(user_id),
    doctor_id      VARCHAR(36)  NOT NULL REFERENCES doctors(doctor_id),
    schedule_id    VARCHAR(36)  NOT NULL REFERENCES schedules(schedule_id),
    status         VARCHAR(20)  NOT NULL DEFAULT 'Booked'
                                CHECK (status IN ('Booked','Arrived','In-Consultation','Completed','No-Show')),
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    UNIQUE (doctor_id, schedule_id)
);
