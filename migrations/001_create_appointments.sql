CREATE TABLE appointments (
  appointment_id VARCHAR PRIMARY KEY,
  patient_id     VARCHAR NOT NULL,
  doctor_id      VARCHAR NOT NULL,
  schedule_id    VARCHAR NOT NULL,
  status         VARCHAR NOT NULL,
  created_at     TIMESTAMP DEFAULT NOW()
);
