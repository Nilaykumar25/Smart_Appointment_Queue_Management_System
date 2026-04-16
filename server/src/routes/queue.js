// Implements: REQ-7  — Real-time queue updates
// Implements: REQ-8  — Wait time based on avg consultation duration
// Implements: REQ-13 — Auto no-show flag (cron handles flagging; this serves the data)
// See SRS Section 4.3 — Queue Management

const express     = require('express');
const router      = express.Router();
const db          = require('../db/connection');
const requireRole = require('../middleware/requireRole');

// ─── Queue Position Mapping Strategy ─────────────────────────────────────────
// - Each patient gets a queue position based on their appointment start time
// - Position = count of all appointments with earlier start times for same doctor/date
// - Patients remain in queue while status is "Booked" or "Arrived"
// - Once marked "Completed" or "No-Show", they exit queue and others move up
// - Staff dashboard polls every 30 seconds for real-time updates
// ─────────────────────────────────────────────────────────────────────────────

// Helper: ensure all of today's active appointments have a queue entry
// Called by GET /today so the queue self-heals if entries are missing
async function ensureQueueEntries(client) {
  const { rows: missing } = await client.query(
    `SELECT a.appointment_id
     FROM appointments a
     JOIN schedules s ON s.schedule_id = a.schedule_id
     LEFT JOIN queue q ON q.appointment_id = a.appointment_id
     WHERE DATE(s.date AT TIME ZONE 'Asia/Kolkata') = (NOW() AT TIME ZONE 'Asia/Kolkata')::date
       AND a.status NOT IN ('Completed', 'No-Show')
       AND q.queue_id IS NULL
     ORDER BY s.start_time`
  );

  if (missing.length === 0) return;

  const { rows: maxRow } = await client.query(
    `SELECT COALESCE(MAX(q.queue_position), 0) AS max_pos
     FROM queue q
     JOIN appointments a ON a.appointment_id = q.appointment_id
     JOIN schedules s    ON s.schedule_id = a.schedule_id
     WHERE DATE(s.date AT TIME ZONE 'Asia/Kolkata') = (NOW() AT TIME ZONE 'Asia/Kolkata')::date`
  );

  let pos = parseInt(maxRow[0].max_pos);

  for (const row of missing) {
    pos += 1;
    await client.query(
      `INSERT INTO queue (appointment_id, queue_position, estimated_wait_time)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [row.appointment_id, pos, pos * 10]
    );
  }
}

// GET /api/queue/today
// Returns all appointments for today with queue position and patient info
// Called by: QueueDashboard.jsx every 30 seconds
router.get('/today', requireRole(['admin', 'staff']), async (req, res) => {
  const client = await db.getClient();
  try {
    // Auto-create missing queue entries before fetching
    await ensureQueueEntries(client);

    const { rows } = await client.query(
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
             AND s2.date = s.date
             AND s2.start_time < s.start_time
             AND a2.status IN ('Booked', 'Arrived')
         ) * COALESCE(d.avg_consultation_duration, 15) AS "estimatedWaitMinutes"
       FROM appointments a
       JOIN users u        ON u.user_id       = a.patient_id
       JOIN schedules s    ON s.schedule_id   = a.schedule_id
       JOIN doctors d      ON d.doctor_id     = a.doctor_id
       LEFT JOIN queue q   ON q.appointment_id = a.appointment_id
       WHERE DATE(s.date AT TIME ZONE 'Asia/Kolkata') = (NOW() AT TIME ZONE 'Asia/Kolkata')::date
         AND a.status NOT IN ('Completed', 'No-Show')
       ORDER BY COALESCE(q.queue_position, 9999), s.start_time`
    );

    res.json(rows);
  } catch (err) {
    console.error('GET /queue/today error:', err);
    res.status(500).json({ error: 'Failed to fetch today\'s queue' });
  } finally {
    client.release();
  }
});

// PATCH /api/queue/reorder
// Swap queue positions between two appointments
// Body: { appointmentId, direction: 'up' | 'down' }
// Called by: QueueDashboard.jsx ↑↓ buttons
router.patch('/reorder', requireRole(['admin', 'staff']), async (req, res) => {
  const { appointmentId, direction } = req.body;

  if (!appointmentId || !['up', 'down'].includes(direction)) {
    return res.status(400).json({ error: 'appointmentId and direction (up|down) are required' });
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Ensure queue entries exist before reordering
    await ensureQueueEntries(client);

    const { rows: current } = await client.query(
      `SELECT q.queue_id, q.queue_position
       FROM queue q
       WHERE q.appointment_id = $1`,
      [appointmentId]
    );

    if (current.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Appointment not found in queue' });
    }

    const currentPos     = current[0].queue_position;
    const currentQueueId = current[0].queue_id;
    const targetPos      = direction === 'up' ? currentPos - 1 : currentPos + 1;

    const { rows: target } = await client.query(
      `SELECT q.queue_id
       FROM queue q
       JOIN appointments a ON a.appointment_id = q.appointment_id
       JOIN schedules s    ON s.schedule_id = a.schedule_id
       WHERE q.queue_position = $1
         AND DATE(s.date AT TIME ZONE 'Asia/Kolkata') = (NOW() AT TIME ZONE 'Asia/Kolkata')::date
         AND a.status NOT IN ('Completed', 'No-Show')`,
      [targetPos]
    );

    if (target.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Already at the boundary of the queue' });
    }

    const targetQueueId = target[0].queue_id;

    // Swap using a temp position to avoid unique constraint violation
    await client.query(`UPDATE queue SET queue_position = 99999 WHERE queue_id = $1`, [currentQueueId]);
    await client.query(`UPDATE queue SET queue_position = $1    WHERE queue_id = $2`, [currentPos, targetQueueId]);
    await client.query(`UPDATE queue SET queue_position = $1    WHERE queue_id = $2`, [targetPos, currentQueueId]);

    await client.query('COMMIT');
    res.json({ message: 'Queue order updated', newPosition: targetPos });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('PATCH /queue/reorder error:', err);
    res.status(500).json({ error: 'Failed to reorder queue' });
  } finally {
    client.release();
  }
});

module.exports = router;
