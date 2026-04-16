// Implements: REQ-7  — Real-time queue updates
// Implements: REQ-8  — Wait time based on avg consultation duration
// Implements: REQ-13 — Auto no-show flag (cron handles flagging; this serves the data)
// See SRS Section 4.3 — Queue Management

const express     = require('express');
const router      = express.Router();
const db          = require('../db/connection');
const requireRole = require('../middleware/requireRole');

// ═══════════════════════════════════════════════════════════════════════════════════════
// REQ-7 & REQ-8: GET /api/queue/today — Real-time queue with accurate wait times
// ═══════════════════════════════════════════════════════════════════════════════════════
router.get('/today', requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT
         a.appointment_id  AS "appointmentId",
         u.name            AS "patientName",
         q.queue_position  AS "queuePosition",
         TO_CHAR(s.start_time, 'HH24:MI') AS "scheduledTime",
         a.status,
         d.avg_consultation_duration AS "avgConsultationDuration",
         -- REQ-8: Live wait = patients ahead × avg consultation duration
         (
           SELECT COUNT(*)
           FROM queue q2
           JOIN appointments a2 ON a2.appointment_id = q2.appointment_id
           JOIN schedules s2    ON s2.schedule_id    = a2.schedule_id
           WHERE a2.doctor_id = a.doctor_id
             AND s2.date = CURRENT_DATE
             AND s2.start_time < s.start_time
             AND a2.status IN ('Booked', 'Arrived')
         ) * COALESCE(d.avg_consultation_duration, 15) AS "estimatedWaitMinutes"
       FROM appointments a
       JOIN users u        ON u.user_id       = a.patient_id
       JOIN schedules s    ON s.schedule_id   = a.schedule_id
       JOIN doctors d      ON d.doctor_id     = a.doctor_id
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
