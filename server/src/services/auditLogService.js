// Implements: REQ-18 — Immutable audit trail
// See SRS Section 7.4.2 — Logging, Auditing and Monitoring
// See SRS Section 7.3.1 — Audit_Logs table
// NOW WIRED TO DB (connection.js exists)

const db = require("../db/connection");

const auditLog = async ({
  userId,
  action,
  entityType,
  entityId,
  oldValue,
  newValue,
  ipAddress,
  userAgent,
}) => {
  try {
    // Skip audit if userId is not a valid UUID (e.g. "unknown" from unauthenticated requests)
    if (!userId || userId === 'unknown' || !/^[0-9a-f-]{36}$/i.test(userId)) {
      console.warn('[AUDIT] Skipped — no valid userId:', userId, action);
      return;
    }

    await db.query(
      `INSERT INTO audit_logs
         (user_id, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId,
        action,
        entityType,
        entityId,
        JSON.stringify(oldValue),
        JSON.stringify(newValue),
        ipAddress,
        userAgent,
      ]
    );
  } catch (err) {
    // Audit failure must NEVER crash the main request — just log it
    console.error("[AUDIT] DB write failed:", err.message);
  }
};

module.exports = auditLog;
