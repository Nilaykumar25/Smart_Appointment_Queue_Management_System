ALTER TABLE appointments
  ADD CONSTRAINT fk_appt_patient  FOREIGN KEY (patient_id)  REFERENCES users(user_id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_appt_doctor   FOREIGN KEY (doctor_id)   REFERENCES doctors(doctor_id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_appt_schedule FOREIGN KEY (schedule_id) REFERENCES schedules(schedule_id) ON DELETE RESTRICT;

ALTER TABLE queue
  ADD CONSTRAINT fk_queue_appt FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE RESTRICT;

ALTER TABLE notifications
  ADD CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT;

ALTER TABLE audit_logs
  ADD CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT;

ALTER TABLE appointments
  ADD CONSTRAINT chk_status CHECK (
    status IN ('Booked','Arrived','In-Consultation','Completed','No-Show')
  );

CREATE RULE no_update_audit AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;
CREATE RULE no_delete_audit AS ON DELETE TO audit_logs DO INSTEAD NOTHING;
