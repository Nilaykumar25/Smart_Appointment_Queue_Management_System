-- Migration 001: Users table
-- Implements: REQ-1 (role-based access), REQ-2 (encrypted fields)

CREATE TABLE users (
    user_id       VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(20)  NOT NULL CHECK (role IN ('patient', 'staff', 'admin')),
    mfa_secret    VARCHAR(255),
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);
