-- Migration 006: Notifications table
-- Implements: REQ-16 (confirmations), REQ-17 (broadcast alerts)

CREATE TABLE notifications (
    notification_id VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         VARCHAR(36)  NOT NULL REFERENCES users(user_id),
    message         TEXT         NOT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'Pending'
                                 CHECK (status IN ('Pending','Sent','Failed')),
    timestamp       TIMESTAMP    NOT NULL DEFAULT NOW()
);