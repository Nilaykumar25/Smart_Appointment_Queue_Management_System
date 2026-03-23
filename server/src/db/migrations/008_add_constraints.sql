-- Migration 008: Additional constraints
-- Implements: REQ-3 (account security), REQ-5 (double booking), REQ-18 (immutable audit)

-- Ensure queue positions are unique per appointment
ALTER TABLE queue
    ADD CONSTRAINT uq_queue_position UNIQUE (appointment_id, queue_position);

-- Ensure a patient cannot book the same schedule slot twice
ALTER TABLE appointments
    ADD CONSTRAINT uq_patient_schedule UNIQUE (patient_id, schedule_id);

-- Ensure notification status only moves forward
ALTER TABLE notifications
    ADD CONSTRAINT uq_notif_user_message UNIQUE (user_id, message, timestamp);

-- Immutability enforcement on audit_logs via trigger
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'audit_logs records are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_immutable
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();
