// Implements: REQ-18 — Immutable audit trail
// See SRS Section 7.4.2 — Logging, Auditing and Monitoring
// See SRS Section 7.3.1 — Audit_Logs table

// Example usage on a protected admin route:
// router.patch('/schedules/:id',
//   requireRole(['admin']),
//   auditMiddleware('SCHEDULE'),
//   scheduleController.updateSlot
// );

const redisClient = require("../db/redis");

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
    // TODO: insert into audit_logs table when DB is connected
    // await db.query(
    //   `INSERT INTO audit_logs
    //     (user_id, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent)
    //    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    //   [userId, action, entityType, entityId,
    //    JSON.stringify(oldValue), JSON.stringify(newValue),
    //    ipAddress, userAgent]
    // );

    // Log to console until DB is wired
    console.log("[AUDIT]", {
      userId,
      action,
      entityType,
      entityId,
      oldValue,
      newValue,
      ipAddress,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    // Audit failure must never crash the main request
    console.error("Audit log failed:", err);
  }
};

module.exports = auditLog;
