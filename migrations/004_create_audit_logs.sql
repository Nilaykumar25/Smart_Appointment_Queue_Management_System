CREATE TABLE audit_logs (
  log_id        VARCHAR PRIMARY KEY,
  user_id       VARCHAR NOT NULL,
  action        VARCHAR NOT NULL,
  entity_type   VARCHAR NOT NULL,
  entity_id     VARCHAR NOT NULL,
  old_value     JSONB,
  new_value     JSONB,
  ip_address    VARCHAR NOT NULL,
  user_agent    VARCHAR,
  timestamp     TIMESTAMP DEFAULT NOW()
);
