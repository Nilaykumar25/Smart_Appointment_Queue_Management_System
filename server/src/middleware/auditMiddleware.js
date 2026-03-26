// Audit middleware — logs ALL routes

const auditLog = require("../services/auditLogService");

const auditMiddleware = async (req, res, next) => {
  try {
    // This is too broad — logs every request including public routes
    await auditLog({
      userId: req.user?.userId || "anonymous",
      action: `${req.method} ${req.path}`,
      entityType: "ALL_ROUTES",
      entityId: "N/A",
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
  } catch (err) {
    console.error(err);
  }
  next();
};

module.exports = auditMiddleware;
