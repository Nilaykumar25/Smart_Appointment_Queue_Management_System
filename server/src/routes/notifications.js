// Implements: REQ-16 — Instant booking/cancellation confirmation notifications
// Implements: REQ-17 — Broadcast alerts to all patients for clinic-wide delays
// See SRS Section 4.7 — Notification and Alerts Management

const express     = require("express");
const router      = express.Router();
const db          = require("../db/connection");
const requireRole = require("../middleware/requireRole");

// ─────────────────────────────────────────────────────────────────────────────
// Helper: save a notification record to the DB
// Called internally by this file and can be imported by appointments.js
// ─────────────────────────────────────────────────────────────────────────────
async function saveNotification(userId, message) {
  await db.query(
    `INSERT INTO notifications (user_id, message, status)
     VALUES ($1, $2, 'Sent')`,
    [userId, message]
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/notifications/broadcast
// Staff sends a clinic-wide alert to ALL patients currently in the queue (REQ-17)
// Body: { message: 'Doctor delayed by 30 minutes' }
// Called by: BroadcastAlertForm.jsx
// ─────────────────────────────────────────────────────────────────────────────
router.post("/broadcast", requireRole(["admin", "staff"]), async (req, res) => {
  const { message, target = "all_waiting" } = req.body;

  if (!message || message.trim() === "") {
    return res.status(400).json({ error: "message is required" });
  }

  try {
    let queryText;

    if (target === "all_waiting") {
      // All patients currently in queue with Booked or Arrived status
      queryText = `
        SELECT DISTINCT a.patient_id
        FROM appointments a
        WHERE a.status IN ('Booked', 'Arrived', 'In-Consultation')`;

    } else if (target === "next_5") {
      // Next 5 patients in queue ordered by queue position
      queryText = `
        SELECT DISTINCT a.patient_id
        FROM appointments a
        JOIN queue q ON q.appointment_id = a.appointment_id
        WHERE a.status IN ('Booked', 'Arrived')
        ORDER BY q.queue_position ASC
        LIMIT 5`;

    } else if (target === "all_today") {
      // All patients with an appointment today (any status except cancelled)
      queryText = `
        SELECT DISTINCT a.patient_id
        FROM appointments a
        JOIN schedules s ON s.schedule_id = a.schedule_id
        WHERE DATE(s.date) = CURRENT_DATE
          AND a.status NOT IN ('No-Show', 'Completed')`;

    } else {
      return res.status(400).json({
        error: "target must be all_waiting, next_5, or all_today",
      });
    }

    const { rows: activePatients } = await db.query(queryText);

    if (activePatients.length === 0) {
      return res.json({
        message: "No patients found for the selected target group",
        sentCount: 0,
      });
    }

    // Save a notification row for each patient
    for (const patient of activePatients) {
      await saveNotification(patient.patient_id, message.trim());
    }

    console.log(`[BROADCAST][${target}] Sent to ${activePatients.length} patients: "${message}"`);

    res.status(201).json({
      message:   "Broadcast alert sent successfully",
      sentCount: activePatients.length,
    });
  } catch (err) {
    console.error("POST /notifications/broadcast error:", err);
    res.status(500).json({ error: "Failed to send broadcast alert" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/notifications/confirm
// Send booking or cancellation confirmation to a single patient (REQ-16)
// Body: { userId, type: 'booking' | 'cancellation', appointmentDetails }
// Called internally by appointments.js after a booking/cancel action
// ─────────────────────────────────────────────────────────────────────────────
router.post("/confirm", async (req, res) => {
  const { userId, type, appointmentDetails } = req.body;

  if (!userId || !type) {
    return res.status(400).json({ error: "userId and type are required" });
  }

  const messages = {
    booking:      `Your appointment has been booked successfully. Details: ${JSON.stringify(appointmentDetails || {})}`,
    cancellation: `Your appointment has been cancelled. We hope to see you soon.`,
    reschedule:   `Your appointment has been rescheduled. New details: ${JSON.stringify(appointmentDetails || {})}`,
  };

  const message = messages[type];
  if (!message) {
    return res.status(400).json({ error: "type must be booking, cancellation, or reschedule" });
  }

  try {
    await saveNotification(userId, message);

    res.status(201).json({ message: "Confirmation notification sent" });
  } catch (err) {
    console.error("POST /notifications/confirm error:", err);
    res.status(500).json({ error: "Failed to send confirmation" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/notifications/my
// Get all notifications for the logged-in patient
// Called by: patient dashboard to show notification bell
// ─────────────────────────────────────────────────────────────────────────────
router.get("/my", requireRole(["patient", "staff", "admin"]), async (req, res) => {
  const userId = req.user?.userId;

  try {
    const { rows } = await db.query(
      `SELECT
         notification_id AS "notificationId",
         message,
         status,
         TO_CHAR(timestamp, 'YYYY-MM-DD HH24:MI') AS "sentAt"
       FROM notifications
       WHERE user_id = $1
       ORDER BY timestamp DESC
       LIMIT 50`,
      [userId]
    );

    res.json({ notifications: rows });
  } catch (err) {
    console.error("GET /notifications/my error:", err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Export saveNotification so appointments.js can reuse it without a HTTP call
module.exports = router;
module.exports.saveNotification = saveNotification;
