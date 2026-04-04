// Implements: REQ-1 — Role-Based Access Control
// See SRS Section 7.4.1 — Authorization

const jwt = require("jsonwebtoken");

// Usage: router.get('/admin/reports', requireRole(['admin']), handler)
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "No token provided" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!allowedRoles.includes(decoded.role)) {
        return res
          .status(403)
          .json({ error: "Access denied — insufficient role" });
      }

      req.user = decoded;
      next();
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ error: "Token expired" });
      }
      return res.status(401).json({ error: "Invalid token" });
    }
  };
};

module.exports = requireRole;
