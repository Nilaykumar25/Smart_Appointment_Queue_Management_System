-- Migration 007: Audit Logs table
-- Implements: REQ-18 (immutable audit trail)

CREATE TABLE audit_logs (
    log_id        VARCHAR(36)  PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       VARCHAR(36)  NOT NULL REFERENCES users(user_id),
    action        VARCHAR(100) NOT NULL,
    entity_type   VARCHAR(50)  NOT NULL,
    entity_id     VARCHAR(36)  NOT NULL,
    old_value     JSONB,
    new_value     JSONB,
    ip_address    VARCHAR(45)  NOT NULL,
    user_agent    VARCHAR(255),
    timestamp     TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Prevent updates and deletes on audit_logs to ensure immutability
CREATE RULE no_update_audit AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;
CREATE RULE no_delete_audit AS ON DELETE TO audit_logs DO INSTEAD NOTHING;
