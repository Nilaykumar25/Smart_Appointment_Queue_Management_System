// Implements: REQ-7  — Real-time queue updates
// Implements: REQ-13 — Auto no-show flag (cron handles flagging; this serves the data)
// See SRS Section 4.3 — Queue Management

const express     = require('express');
const router      = express.Router();
const db          = require('../db/connection');
const requireRole = require('../middleware/requireRole');

// ═══════════════════════════════════════════════════════════════════════════════════════
// REQ-7: GET /api/queue/today — Real-time queue position mapping
// ═══════════════════════════════════════════════════════════════════════════════════════
/**
 * Queue Position Mapping Strategy:
 *   - Each patient gets a queue position based on their appointment start time
 *   - Position = count of all appointments with earlier start times for same doctor/date
 *   - Patients remain in queue while status is "Booked" or "Arrived"
 *   - Once marked "Completed" or "No-Show", they exit queue and others move up
 *
 * Real-time Updates:
 *   - Staff calls this endpoint every 30 seconds (QueueDashboard polling)
 *   - Position mapping recalculates based on current status of all appointments
 *   - When a patient is marked "Attended" (Completed/No-Show):
 *     * They are deleted from queue table
 *     * All subsequent patients' positions shift down by 1
 *     * Dashboard clients poll and receive updated positions
 *
 * Display Order in Staff UI:
 *   - Ordered by queue_position (ascending)
 *   - Patients with lower positions appear first
 *   - Non-queued patients (Completed/No-Show) appear at end
 */
router.get('/today', requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT
         a.appointment_id  AS "appointmentId",
         u.name            AS "patientName",
         q.queue_position  AS "queuePosition",
         TO_CHAR(s.start_time, 'HH24:MI') AS "scheduledTime",
         a.status
       FROM appointments a
       JOIN users u        ON u.user_id       = a.patient_id
       JOIN schedules s    ON s.schedule_id   = a.schedule_id
       LEFT JOIN queue q   ON q.appointment_id = a.appointment_id
       WHERE s.date = CURRENT_DATE
         AND a.status NOT IN ('Completed', 'No-Show')
       ORDER BY COALESCE(q.queue_position, 9999), s.start_time`
    );

    res.json(rows);
  } catch (err) {
    console.error('GET /queue/today error:', err);
    res.status(500).json({ error: 'Failed to fetch today\'s queue' });
  }
});

module.exports = router;
