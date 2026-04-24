// Implements: REQ-7  — Real-time queue updates
// Implements: REQ-8  — Wait time based on avg consultation duration
// Implements: REQ-13 — Auto no-show flag (cron handles flagging; this serves the data)
// See SRS Section 4.3 — Queue Management

const express     = require('express');
const router      = express.Router();
const db          = require('../db/connection');
const requireRole = require('../middleware/requireRole');
const { getTodayIST, formatISTSQL } = require('../utils/timezone');

// ─── Queue Position Mapping Strategy ─────────────────────────────────────────
// - Each patient gets a queue position based on their appointment start time
// - Position = count of all appointments with earlier start times for same doctor/date
// - Patients remain in queue while status is "Booked" or "Arrived"
// - Once marked "Completed" or "No-Show", they exit queue and others move up
// - Staff dashboard polls every 30 seconds for real-time updates (today only)
// - Enhanced to support viewing/managing queues for any date
// ─────────────────────────────────────────────────────────────────────────────

// Helper: ensure all of today's active appointments have a queue entry
// Called by GET /today so the queue self-heals if entries are missing
// Enhanced to support specific dates, fix duplicate positions, and handle multiple patients per slot
async function ensureQueueEntries(client, targetDate = null) {
  // Default to today if no date specified
  const dateCondition = targetDate 
    ? `DATE(s.date) = $1`
    : `DATE(s.date) = $1`;
  
  const queryParams = targetDate ? [targetDate] : [getTodayIST()];

  // Get all appointments that should be in queue, ordered by appointment time, then by booking order
  const { rows: shouldBeInQueue } = await client.query(
    `SELECT a.appointment_id, s.start_time, a.created_at
     FROM appointments a
     JOIN schedules s ON s.schedule_id = a.schedule_id
     WHERE ${dateCondition}
       AND a.status NOT IN ('Completed', 'No-Show')
     ORDER BY s.start_time, a.created_at`,
    queryParams
  );

  if (shouldBeInQueue.length === 0) return;

  // Get existing queue entries
  const { rows: existingQueue } = await client.query(
    `SELECT q.appointment_id, q.queue_position
     FROM queue q
     JOIN appointments a ON a.appointment_id = q.appointment_id
     JOIN schedules s ON s.schedule_id = a.schedule_id
     WHERE ${dateCondition}
       AND a.status NOT IN ('Completed', 'No-Show')`,
    queryParams
  );

  // Create a map of existing entries
  const existingMap = new Map();
  existingQueue.forEach(entry => {
    existingMap.set(entry.appointment_id, entry.queue_position);
  });

  // Fix/create queue entries with proper sequential positions
  // Queue position is based on: 1) appointment time, 2) booking order within same time
  for (let i = 0; i < shouldBeInQueue.length; i++) {
    const appointment = shouldBeInQueue[i];
    const correctPosition = i + 1;
    const currentPosition = existingMap.get(appointment.appointment_id);

    if (!currentPosition) {
      // Missing queue entry - create it (but only if it doesn't already exist due to unique constraint)
      try {
        await client.query(
          `INSERT INTO queue (appointment_id, queue_position, estimated_wait_time)
           VALUES ($1, $2, $3)`,
          [appointment.appointment_id, correctPosition, correctPosition * 10]
        );
        console.log(`[QUEUE FIX] Created queue entry for appointment ${appointment.appointment_id} at position ${correctPosition}`);
      } catch (err) {
        if (err.code === '23505') {
          // Unique constraint violation - queue entry already exists, skip
          console.log(`[QUEUE FIX] Queue entry already exists for appointment ${appointment.appointment_id}`);
        } else {
          throw err;
        }
      }
    } else if (currentPosition !== correctPosition) {
      // Wrong position - fix it
      await client.query(
        `UPDATE queue SET queue_position = $1 
         WHERE appointment_id = $2`,
        [correctPosition, appointment.appointment_id]
      );
      console.log(`[QUEUE FIX] Fixed position for appointment ${appointment.appointment_id}: ${currentPosition} → ${correctPosition}`);
    }
  }

  // Remove any queue entries that shouldn't exist
  const shouldExistIds = shouldBeInQueue.map(a => a.appointment_id);
  if (shouldExistIds.length > 0) {
    const placeholders = shouldExistIds.map((_, i) => `$${i + 2}`).join(',');
    await client.query(
      `DELETE FROM queue 
       WHERE appointment_id IN (
         SELECT q.appointment_id 
         FROM queue q
         JOIN appointments a ON a.appointment_id = q.appointment_id
         JOIN schedules s ON s.schedule_id = a.schedule_id
         WHERE ${dateCondition}
           AND q.appointment_id NOT IN (${placeholders})
       )`,
      [queryParams[0], ...shouldExistIds]
    );
  }
}

// GET /api/queue/today
// Returns all appointments for today with queue position and patient info
// Enhanced: Shows multiple patients per time slot with proper ordering
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
         TO_CHAR(s.end_time, 'HH24:MI') AS "endTime",
         a.status,
         d.avg_consultation_duration AS "avgConsultationDuration",
         s.max_capacity AS "slotCapacity",
         -- Count how many patients are in this same time slot
         (
           SELECT COUNT(*)
           FROM appointments a2
           JOIN schedules s2 ON s2.schedule_id = a2.schedule_id
           WHERE a2.doctor_id = a.doctor_id
             AND s2.date = s.date
             AND s2.start_time = s.start_time
             AND a2.status NOT IN ('Completed', 'No-Show')
         ) AS "patientsInSlot",
         -- REQ-8: Live wait = patients ahead × avg consultation duration
         (
           SELECT COUNT(*)
           FROM queue q2
           JOIN appointments a2 ON a2.appointment_id = q2.appointment_id
           JOIN schedules s2    ON s2.schedule_id    = a2.schedule_id
           WHERE a2.doctor_id = a.doctor_id
             AND s2.date = s.date
             AND (s2.start_time < s.start_time OR 
                  (s2.start_time = s.start_time AND a2.created_at < a.created_at))
             AND a2.status IN ('Booked', 'Arrived')
         ) * COALESCE(d.avg_consultation_duration, 15) AS "estimatedWaitMinutes"
       FROM appointments a
       JOIN users u        ON u.user_id       = a.patient_id
       JOIN schedules s    ON s.schedule_id   = a.schedule_id
       JOIN doctors d      ON d.doctor_id     = a.doctor_id
       LEFT JOIN queue q   ON q.appointment_id = a.appointment_id
       WHERE DATE(s.date) = $1
         AND a.status NOT IN ('Completed', 'No-Show')
       ORDER BY COALESCE(q.queue_position, 9999), s.start_time, a.created_at`,
      [getTodayIST()]
    );

    res.json(rows);
  } catch (err) {
    console.error('GET /queue/today error:', err);
    res.status(500).json({ error: 'Failed to fetch today\'s queue' });
  } finally {
    client.release();
  }
});

// GET /api/queue/date/:date
// Returns all appointments for a specific date with queue position and patient info
// Called by: QueueDashboard.jsx when viewing non-today dates
router.get('/date/:date', requireRole(['admin', 'staff']), async (req, res) => {
  const { date } = req.params;
  
  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  }

  const client = await db.getClient();
  try {
    // For non-today dates, we still ensure queue entries exist but don't auto-create them
    // This allows viewing historical data without modifying it
    // Use IST for date comparison
    const todayIST = getTodayIST();
    const isToday = date === todayIST;
    
    if (isToday) {
      await ensureQueueEntries(client, date);
    }

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
       WHERE DATE(s.date) = $1
         AND a.status NOT IN ('Completed', 'No-Show')
       ORDER BY COALESCE(q.queue_position, 9999), s.start_time`,
      [date]
    );

    res.json(rows);
  } catch (err) {
    console.error(`GET /queue/date/${date} error:`, err);
    res.status(500).json({ error: 'Failed to fetch queue for specified date' });
  } finally {
    client.release();
  }
});

// PATCH /api/queue/reorder
// Swap queue positions between two appointments
// Body: { appointmentId, direction: 'up' | 'down', date?: 'YYYY-MM-DD' }
// Called by: QueueDashboard.jsx ↑↓ buttons
// Enhanced: Works with any queue positions, handles gaps, sends notifications
router.patch('/reorder', requireRole(['admin', 'staff']), async (req, res) => {
  const { appointmentId, direction, date } = req.body;

  if (!appointmentId || !['up', 'down'].includes(direction)) {
    return res.status(400).json({ error: 'appointmentId and direction (up|down) are required' });
  }

  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Use provided date or default to today in IST
    const todayIST = getTodayIST();
    const targetDate = date || todayIST;
    const isToday = targetDate === todayIST;

    // Ensure queue entries exist before reordering (only for today)
    if (isToday) {
      await ensureQueueEntries(client, targetDate);
    }

    // Get all queue entries for the date, ordered by position
    const { rows: allQueueEntries } = await client.query(
      `SELECT 
         q.queue_id, 
         q.appointment_id, 
         q.queue_position, 
         a.patient_id, 
         u.name as patient_name
       FROM queue q
       JOIN appointments a ON a.appointment_id = q.appointment_id
       JOIN schedules s ON s.schedule_id = a.schedule_id
       JOIN users u ON u.user_id = a.patient_id
       WHERE DATE(s.date) = $1
         AND a.status NOT IN ('Completed', 'No-Show')
       ORDER BY q.queue_position`,
      [targetDate]
    );

    if (allQueueEntries.length < 2) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Need at least 2 patients in queue to reorder' });
    }

    // Find the current appointment in the ordered list
    const currentIndex = allQueueEntries.findIndex(entry => entry.appointment_id === appointmentId);
    
    if (currentIndex === -1) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Appointment not found in queue' });
    }

    // Calculate target index
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // Check boundaries
    if (targetIndex < 0 || targetIndex >= allQueueEntries.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Already at the boundary of the queue' });
    }

    // Get the two entries to swap
    const currentEntry = allQueueEntries[currentIndex];
    const targetEntry = allQueueEntries[targetIndex];

    // Swap their queue positions in the database
    await client.query(`UPDATE queue SET queue_position = 99999 WHERE queue_id = $1`, [currentEntry.queue_id]);
    await client.query(`UPDATE queue SET queue_position = $1 WHERE queue_id = $2`, [currentEntry.queue_position, targetEntry.queue_id]);
    await client.query(`UPDATE queue SET queue_position = $1 WHERE queue_id = $2`, [targetEntry.queue_position, currentEntry.queue_id]);

    await client.query('COMMIT');

    // Send notifications to both affected patients about their position change
    const { saveNotification } = require('./notifications');
    
    try {
      // Notify the patient who was moved
      const movedDirection = direction === 'up' ? 'earlier' : 'later';
      await saveNotification(
        currentEntry.patient_id, 
        `Your queue position has been updated. You are now position ${targetEntry.queue_position} in the queue (moved ${movedDirection}).`
      );

      // Notify the patient who was displaced
      const displacedDirection = direction === 'up' ? 'later' : 'earlier';
      await saveNotification(
        targetEntry.patient_id, 
        `Your queue position has been updated. You are now position ${currentEntry.queue_position} in the queue (moved ${displacedDirection}).`
      );

      console.log(`[QUEUE REORDER] ${currentEntry.patient_name} (pos ${currentEntry.queue_position}→${targetEntry.queue_position}) and ${targetEntry.patient_name} (pos ${targetEntry.queue_position}→${currentEntry.queue_position}) notified`);
    } catch (notificationError) {
      console.error('Failed to send queue reorder notifications:', notificationError);
      // Don't fail the reorder if notifications fail
    }

    res.json({ 
      message: 'Queue order updated successfully', 
      newPosition: targetEntry.queue_position,
      affectedPatients: [
        { name: currentEntry.patient_name, oldPosition: currentEntry.queue_position, newPosition: targetEntry.queue_position },
        { name: targetEntry.patient_name, oldPosition: targetEntry.queue_position, newPosition: currentEntry.queue_position }
      ]
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('PATCH /queue/reorder error:', err);
    res.status(500).json({ error: 'Failed to reorder queue' });
  } finally {
    client.release();
  }
});

module.exports = router;
