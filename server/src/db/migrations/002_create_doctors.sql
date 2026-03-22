-- Migration 002: Doctors table

CREATE TABLE doctors (
    doctor_id  VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    VARCHAR(36)  NOT NULL REFERENCES users(user_id),
    name       VARCHAR(100) NOT NULL,
    specialty  VARCHAR(100) NOT NULL
);
