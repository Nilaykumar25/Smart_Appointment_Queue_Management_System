CREATE TABLE queue (
  queue_id             VARCHAR PRIMARY KEY,
  appointment_id       VARCHAR NOT NULL,
  queue_position       INTEGER NOT NULL,
  estimated_wait_time  INTEGER NOT NULL
);
