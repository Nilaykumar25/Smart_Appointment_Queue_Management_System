// SAQMS Express Server — entry point
// Implements: All routes, CORS, cookie-parser, middleware mounting
// See SRS Section 7.1 — System Architecture

require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });
const express      = require("express");
const cors         = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.CLIENT_URL || "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ],
  credentials: true,   // needed for httpOnly refresh token cookie
}));
app.use(express.json());
app.use(cookieParser());

// ─── Routes ──────────────────────────────────────────────────────────────────
const authRoutes         = require("./routes/auth");
const appointmentRoutes  = require("./routes/appointments");
const doctorRoutes       = require("./routes/doctors");
const slotRoutes         = require("./routes/slots");
const scheduleRoutes     = require("./routes/scheduleRoutes");
const notificationRoutes = require("./routes/notifications");
const queueRoutes        = require("./routes/queue");
const reportsRoutes      = require("./routes/reports");

app.use("/api/auth",          authRoutes);
app.use("/api/appointments",  appointmentRoutes);
app.use("/api/doctors",       doctorRoutes);
app.use("/api/schedules",     slotRoutes);
app.use("/api/schedule",      scheduleRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/queue",         queueRoutes);
app.use("/api/reports",       reportsRoutes);       // GET /api/reports/daily

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Start cron jobs ──────────────────────────────────────────────────────────
require("./cron");

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
