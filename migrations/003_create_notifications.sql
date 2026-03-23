CREATE TABLE notifications (
  notification_id  VARCHAR PRIMARY KEY,
  user_id          VARCHAR NOT NULL,
  message          TEXT NOT NULL,
  status           VARCHAR NOT NULL,
  timestamp        TIMESTAMP DEFAULT NOW()
);
