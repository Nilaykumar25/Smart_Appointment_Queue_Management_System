const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { saveNotification } = require('./notifications');
const { getTodayIST } = require('../utils/timezone');
const requireRole = require('../middleware/requireRole');

// Implements: REQ-5 — Get user's appointments
// GET /appointments/user/:userId — get all appointments for a specific user
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const { rows } = await db.query(
      `SELECT
         a.appointment_id AS "id",
         a.appointment_id,
         u.name AS "patientName",
         d.name AS "doctorName",
         d.specialty,
         TO_CHAR(s.date, 'YYYY-MM-DD') AS "date",
         TO_CHAR(s.start_time, 'HH24:MI') AS "time",
         TO_CHAR(s.end_time, 'HH24:MI') AS "endTime",
         a.status
       FROM appointments a
       JOIN users u ON u.user_id = a.patient_id
       JOIN doctors d ON d.doctor_id = a.doctor_id
       JOIN schedules s ON s.schedule_id = a.schedule_id
       WHERE a.patient_id = $1
         AND a.status NOT IN ('Completed', 'No-Show')
         AND s.date >= CURRENT_DATE
       ORDER BY s.date ASC, s.start_time ASC`,
      [userId]
    );
    
    res.json(rows);
  } catch (err) {
    console.error('GET /appointments/user/:userId error:', err);
    res.status(500).json({ error: 'Failed to fetch user appointments' });
  }
});

// Implements: REQ-7 (admin view) — GET /appointments/all
// Returns all upcoming appointments for admin panel
router.get('/all', requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT
         a.appointment_id  AS "appointmentId",
         u.name            AS "patientName",
         d.name            AS "doctorName",
         d.specialty       AS "specialty",
         TO_CHAR(s.date, 'YYYY-MM-DD')       AS "date",
         TO_CHAR(s.start_time, 'HH24:MI')    AS "time",
         a.status
       FROM appointments a
       JOIN users u     ON u.user_id     = a.patient_id
       JOIN doctors d   ON d.doctor_id   = a.doctor_id
       JOIN schedules s ON s.schedule_id = a.schedule_id
       WHERE s.date >= $1
         AND a.status NOT IN ('Completed', 'No-Show')
       ORDER BY s.date ASC, s.start_time ASC`,
      [getTodayIST()]
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /appointments/all error:', err);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Implements: REQ-5 --- see SRS Section 3.5
// Enhanced: REQ-9 --- Validate appointments against facility operating hours
// Enhanced: Multiple patients per slot (max 3) with proper queue ordering
// POST /appointments --- DB-level lock + explicit checks prevent overbooking
router.post('/', async (req, res) => {
  const { patient_id, doctor_id, schedule_id } = req.body;
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // REQ-5: Lock the slot row to prevent concurrent bookings of the same slot
    const { rows: slot } = await client.query(
      `SELECT s.*, 
              EXTRACT(DOW FROM s.date) as day_of_week
       FROM schedules s 
       WHERE s.schedule_id = $1 AND s.is_blackout = FALSE FOR UPDATE`,
      [schedule_id]
    );

    if (slot.length === 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'This slot is unavailable or has been blocked.' });
    }

    const schedule = slot[0];
    
    // REQ-9: Validate appointment against facility operating hours
    // Convert PostgreSQL day_of_week (0=Sunday, 1=Monday, ..., 6=Saturday) to our format (0=Monday, ..., 6=Sunday)
    const facilityDayOfWeek = schedule.day_of_week === 0 ? 6 : schedule.day_of_week - 1;
    
    const { rows: facilityHours } = await client.query(
      `SELECT start_time, end_time, is_operational
       FROM facility_config
       WHERE day_of_week = $1`,
      [facilityDayOfWeek]
    );

    if (facilityHours.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Facility configuration not found for this day.' });
    }

    const facility = facilityHours[0];
    if (!facility.is_operational) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Facility is closed on this day. Please select a different date.' });
    }

    // Check if appointment time falls within facility hours
    if (schedule.start_time < facility.start_time || schedule.end_time > facility.end_time) {
      await client.query('ROLLBACK');
      return res.status(409).json({ 
        error: `This appointment time is outside facility operating hours (${facility.start_time} - ${facility.end_time}). Please select a different slot.` 
      });
    }

    // Enhanced: Check slot capacity (max 3 patients per slot)
    const { rows: existing } = await client.query(
      `SELECT appointment_id FROM appointments
       WHERE schedule_id = $1
         AND status NOT IN ('Completed', 'No-Show')`,
      [schedule_id]
    );

    const maxCapacity = schedule.max_capacity || 3;
    if (existing.length >= maxCapacity) {
      await client.query('ROLLBACK');
      return res.status(409).json({ 
        error: `This time slot is full (${existing.length}/${maxCapacity} patients). Please select a different slot.` 
      });
    }

    // REQ-5: Prevent same patient from booking the same slot twice
    const { rows: patientDuplicate } = await client.query(
      `SELECT appointment_id FROM appointments
       WHERE patient_id = $1 AND schedule_id = $2`,
      [patient_id, schedule_id]
    );

    if (patientDuplicate.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'You already have a booking for this time slot.' });
    }

    // Insert the appointment
    const { rows: appt } = await client.query(
      `INSERT INTO appointments (patient_id, doctor_id, schedule_id, status)
       VALUES ($1, $2, $3, 'Booked') RETURNING *`,
      [patient_id, doctor_id, schedule_id]
    );
    
    // Calculate queue position: count all appointments for this doctor on this date that come before this one
    const { rows: positionResult } = await client.query(
      `SELECT COUNT(*) as position
       FROM appointments a
       JOIN schedules s ON s.schedule_id = a.schedule_id
       JOIN schedules current_s ON current_s.schedule_id = $1
       WHERE a.doctor_id = $2
         AND DATE(s.date) = DATE(current_s.date)
         AND a.status NOT IN ('Completed', 'No-Show')
         AND (s.start_time < current_s.start_time OR 
              (s.start_time = current_s.start_time AND a.created_at <= $3))`,
      [schedule_id, doctor_id, appt[0].created_at]
    );

    const newPosition = parseInt(positionResult[0].position);
    const estimatedWait = Math.max(0, (newPosition - 1) * 15); // 15 min average per patient

    // Create queue entry
    await client.query(
      `INSERT INTO queue (appointment_id, queue_position, estimated_wait_time)
       VALUES ($1, $2, $3)`,
      [appt[0].appointment_id, newPosition, estimatedWait]
    );

    console.log(`[BOOKING] Created appointment ${appt[0].appointment_id} at queue position ${newPosition} with ${estimatedWait}min wait`);

    await client.query('COMMIT');

    // REQ-16 — send booking confirmation notification
    await saveNotification(patient_id, `Your appointment has been booked successfully! You are position ${newPosition} in the queue.`);

    res.status(201).json({
      ...appt[0],
      queuePosition: newPosition,
      estimatedWaitTime: estimatedWait,
      slotCapacity: {
        current: existing.length + 1,
        maximum: maxCapacity
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    // REQ-5: Handle DB-level unique constraint violation (race condition fallback)
    if (err.code === '23505') {
      return res.status(409).json({ error: 'This time slot was just taken. Please select a different slot.' });
    }
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Booking failed' });
  } finally {
    client.release();
  }
});

// Implements: REQ-7 --- see SRS Section 3.7
// Implements: REQ-8 --- Wait time based on avg_consultation_duration
// POST /appointments/queue --- called internally after booking is confirmed
router.post('/queue', async (req, res) => {
  const { appointment_id, patient_id } = req.body;
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // REQ-8: Get appointment details including doctor's avg_consultation_duration
    const { rows: apptDetails } = await client.query(
      `SELECT a.doctor_id, s.date, s.start_time, d.avg_consultation_duration
       FROM appointments a
       JOIN schedules s ON s.schedule_id = a.schedule_id
       JOIN doctors d   ON d.doctor_id   = a.doctor_id
       WHERE a.appointment_id = $1`,
      [appointment_id]
    );

    if (apptDetails.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const { doctor_id, date, start_time, avg_consultation_duration } = apptDetails[0];
    // REQ-8: Use doctor's avg consultation duration (fallback to 15 min if null)
    const consultDuration = avg_consultation_duration || 15;

    // Count existing queue entries for same doctor on same day with earlier time slots
    const { rows: pos } = await client.query(
      `SELECT COUNT(*) AS position
       FROM queue q
       JOIN appointments a ON a.appointment_id = q.appointment_id
       JOIN schedules s ON s.schedule_id = a.schedule_id
       WHERE a.doctor_id = $1
         AND s.date = $2
         AND s.start_time < $3
         AND a.status IN ('Booked', 'Arrived')`,
      [doctor_id, date, start_time]
    );

    const queuePosition = parseInt(pos[0].position) + 1;
    // REQ-8: Wait time = patients ahead × avg consultation duration
    const estimatedWaitTime = (queuePosition - 1) * consultDuration;

    const { rows: entry } = await client.query(
      `INSERT INTO queue (appointment_id, queue_position, estimated_wait_time)
       VALUES ($1, $2, $3) RETURNING *`,
      [appointment_id, queuePosition, estimatedWaitTime]
    );

    await client.query('COMMIT');
    res.status(201).json({ ...entry[0], avg_consultation_duration: consultDuration });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Queue entry error:', err);
    res.status(500).json({ error: 'Queue entry failed' });
  } finally {
    client.release();
  }
});

// Implements: REQ-7, REQ-8 --- see SRS Section 3.7, 3.8
// GET /appointments/queue/:patientId
router.get('/queue/:patientId', async (req, res) => {
  const { patientId } = req.params;

  try {
    const { rows } = await db.query(
      `SELECT q.queue_position AS position,
              q.estimated_wait_time,
              a.appointment_id,
              a.doctor_id,
              d.name AS doctor_name,
              d.specialty,
              d.avg_consultation_duration,
              s.date,
              s.start_time,
              (SELECT COUNT(*)
               FROM queue q2
               JOIN appointments a2 ON a2.appointment_id = q2.appointment_id
               JOIN schedules s2 ON s2.schedule_id = a2.schedule_id
               WHERE a2.doctor_id = a.doctor_id
                 AND s2.date = s.date
                 AND s2.start_time < s.start_time
                 AND a2.status IN ('Booked','Arrived')) AS ahead
       FROM queue q
       JOIN appointments a ON a.appointment_id = q.appointment_id
       JOIN schedules s ON s.schedule_id = a.schedule_id
       JOIN doctors d ON d.doctor_id = a.doctor_id
       WHERE a.patient_id = $1
         AND a.status IN ('Booked', 'Arrived')
       ORDER BY s.date, s.start_time
       LIMIT 1`,
      [patientId]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Not in queue' });

    const row = rows[0];
    const consultDuration = row.avg_consultation_duration || 15;
    // REQ-8: Recalculate wait time from live "ahead" count × avg consultation duration
    const liveWaitTime = parseInt(row.ahead) * consultDuration;

    res.json({ ...row, estimated_wait_time: liveWaitTime, avg_consultation_duration: consultDuration });
  } catch (err) {
    console.error('Queue fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch queue position' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════════════
// REQ-7: Helper function to recalculate queue positions for all remaining patients
// ═══════════════════════════════════════════════════════════════════════════════════════
/**
 * recalculateQueuePositions — Updates position mapping for all patients still in queue
 *
 * Queue Position Mapping Logic:
 *   - When a patient is marked as "Completed" or "No-Show", they are removed from queue
 *   - All remaining patients in the same doctor's queue for the same day must shift up
 *   - Position = Current patient count ahead + 1
 *   - Example: If patient at position 3 is removed, positions 4,5,6 become 3,4,5
 *
 * Algorithm:
 *   1. Get the completed appointment's doctor_id and date
 *   2. Find all queue entries for same doctor/date with status "Booked" or "Arrived"
 *   3. Sort by start_time (earliest appointments are higher in queue)
 *   4. Reassign positions: 1st = position 1, 2nd = position 2, etc.
 *   5. Update estimated wait time based on new position (position × 10 minutes)
 *
 * @param {Client} client - Database client with active transaction
 * @param {string} appointmentId - Appointment that was completed/no-show
 */
async function recalculateQueuePositions(client, appointmentId) {
  try {
    // Step 1: Get the completed appointment's doctor, date, and avg consultation duration
    const { rows: apptInfo } = await client.query(
      `SELECT a.doctor_id, s.date, d.avg_consultation_duration
       FROM appointments a
       JOIN schedules s ON s.schedule_id = a.schedule_id
       JOIN doctors d   ON d.doctor_id   = a.doctor_id
       WHERE a.appointment_id = $1`,
      [appointmentId]
    );

    if (apptInfo.length === 0) return;

    const { doctor_id, date, avg_consultation_duration } = apptInfo[0];
    // REQ-8: Use doctor's avg consultation duration for wait time calculation
    const consultDuration = avg_consultation_duration || 15;

    // Step 2 & 3: Get all remaining queue entries for this doctor/date, sorted by time
    const { rows: remainingQueue } = await client.query(
      `SELECT q.queue_id, a.appointment_id, s.start_time
       FROM queue q
       JOIN appointments a ON a.appointment_id = q.appointment_id
       JOIN schedules s ON s.schedule_id = a.schedule_id
       WHERE a.doctor_id = $1
         AND s.date = $2
         AND a.status IN ('Booked', 'Arrived')
       ORDER BY s.start_time ASC`,
      [doctor_id, date]
    );

    // Step 4 & 5: Reindex positions; wait time = patients ahead × avg consultation duration
    for (let i = 0; i < remainingQueue.length; i++) {
      const newPosition = i + 1;
      // REQ-8: patients ahead of this person × avg duration = their wait
      const newWaitTime = i * consultDuration;

      await client.query(
        `UPDATE queue
         SET queue_position = $1, estimated_wait_time = $2
         WHERE queue_id = $3`,
        [newPosition, newWaitTime, remainingQueue[i].queue_id]
      );
    }

    console.log(`[REQ-7/REQ-8] Queue recalculated for doctor ${doctor_id} on ${date}: ${remainingQueue.length} patients repositioned (${consultDuration} min/patient)`);
  } catch (err) {
    console.error('[REQ-7] Error recalculating queue positions:', err);
  }
}

// Implements: REQ-12 --- see SRS Section 3.12
// Implements: REQ-7  --- see SRS Section 4.3 (Real-time queue position updates)
// PATCH /appointments/:id/status
router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const client = await db.getClient();

  const validStatuses = ['Booked', 'Arrived', 'In-Consultation', 'Completed', 'No-Show'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
  }

  try {
    await client.query('BEGIN');

    const { rows: appt } = await client.query(
      `UPDATE appointments SET status = $1 WHERE appointment_id = $2 RETURNING *`,
      [status, id]
    );

    if (appt.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // REQ-7: Remove from queue and recalculate positions for remaining patients
    // Queue position mapping: When a patient is removed, all subsequent positions shift up by 1
    if (['Completed', 'No-Show'].includes(status)) {
      await client.query(
        `DELETE FROM queue WHERE appointment_id = $1`,
        [id]
      );

      // REQ-7: Recalculate queue positions for all other patients in queue
      // This ensures real-time position updates as staff marks patients as attended
      await recalculateQueuePositions(client, id);
    }

    await client.query('COMMIT');
    res.json({ message: 'Status updated successfully', appointment: appt[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Status update error:', err);
    res.status(500).json({ error: 'Status update failed' });
  } finally {
    client.release();
  }
});

// Implements: REQ-6 --- see SRS Section 3.6
// PATCH /appointments/:id/reschedule --- enforce 2-hour window
router.patch('/:id/reschedule', async (req, res) => {
  const { id } = req.params;
  const { new_schedule_id } = req.body;
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    const { rows: appt } = await client.query(
      `SELECT a.*, s.date, s.start_time
       FROM appointments a
       JOIN schedules s ON s.schedule_id = a.schedule_id
       WHERE a.appointment_id = $1`,
      [id]
    );

    if (appt.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const appointmentTime = new Date(`${appt[0].date}T${appt[0].start_time}`);
    const now = new Date();
    const diffHours = (appointmentTime - now) / (1000 * 60 * 60);

    if (diffHours < 2) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cannot reschedule within 2 hours of appointment' });
    }

    await client.query(
      `UPDATE appointments SET schedule_id = $1, status = 'Booked' WHERE appointment_id = $2`,
      [new_schedule_id, id]
    );

    await client.query('COMMIT');

    // REQ-16 — send reschedule confirmation
    await saveNotification(appt[0].patient_id, 'Your appointment has been rescheduled successfully.');

    res.json({ message: 'Appointment rescheduled successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Reschedule error:', err);
    res.status(500).json({ error: 'Reschedule failed' });
  } finally {
    client.release();
  }
});

// Implements: REQ-6 --- see SRS Section 3.6
// DELETE /appointments/:id --- cancellation with 2-hour deadline check
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    const { rows: appt } = await client.query(
      `SELECT a.*, s.date, s.start_time
       FROM appointments a
       JOIN schedules s ON s.schedule_id = a.schedule_id
       WHERE a.appointment_id = $1`,
      [id]
    );

    if (appt.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const appointmentTime = new Date(`${appt[0].date}T${appt[0].start_time}`);
    const now = new Date();
    const diffHours = (appointmentTime - now) / (1000 * 60 * 60);

    if (diffHours < 2) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cannot cancel within 2 hours of appointment' });
    }

    await client.query(
      `UPDATE appointments SET status = 'Completed' WHERE appointment_id = $1`,
      [id]
    );

    await client.query(
      `DELETE FROM queue WHERE appointment_id = $1`,
      [id]
    );

    await client.query('COMMIT');

    // REQ-16 — send cancellation confirmation
    await saveNotification(appt[0].patient_id, 'Your appointment has been cancelled.');

    res.json({ message: 'Appointment cancelled successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Cancellation error:', err);
    res.status(500).json({ error: 'Cancellation failed' });
  } finally {
    client.release();
  }
});

module.exports = router;
