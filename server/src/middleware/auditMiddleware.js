// Implements: REQ-18 — Immutable audit trail
// Scoped to admin and schedule-change routes only
// See SRS Section 7.4.2 — Logging, Auditing and Monitoring

const auditLog = require("../services/auditLogService");

// Use this middleware only on specific sensitive routes:
// router.patch('/schedules/:id', requireRole(['admin']), auditMiddleware, handler)
// router.post('/schedules/blackout', requireRole(['admin']), auditMiddleware, handler)
// router.patch('/users/:id/role', requireRole(['admin']), auditMiddleware, handler)

const auditMiddleware = (entityType) => async (req, res, next) => {
  try {
    await auditLog({
      userId: req.user?.userId || "unknown",
      action: `${req.method} ${req.path}`,
      entityType: entityType,
      entityId: req.params?.id || "N/A",
      oldValue: null,
      newValue: req.body || null,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
  } catch (err) {
    console.error("Audit middleware error:", err);
  }
  next();
};

module.exports = auditMiddleware;
