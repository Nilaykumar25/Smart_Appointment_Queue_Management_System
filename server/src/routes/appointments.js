const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { saveNotification } = require('./notifications');

// Implements: REQ-5 --- see SRS Section 3.5
// POST /appointments --- DB-level lock prevents double booking
router.post('/', async (req, res) => {
  const { patient_id, doctor_id, schedule_id } = req.body;
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    const { rows: slot } = await client.query(
      `SELECT * FROM schedules WHERE schedule_id = $1 AND is_blackout = FALSE FOR UPDATE`,
      [schedule_id]
    );

    if (slot.length === 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Slot no longer available' });
    }

    const { rows: appt } = await client.query(
      `INSERT INTO appointments (patient_id, doctor_id, schedule_id, status)
       VALUES ($1, $2, $3, 'Booked') RETURNING *`,
      [patient_id, doctor_id, schedule_id]
    );

    await client.query('COMMIT');

    // REQ-16 — send booking confirmation notification
    await saveNotification(patient_id, 'Your appointment has been booked successfully!');

    res.status(201).json(appt[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Booking failed' });
  } finally {
    client.release();
  }
});

// Implements: REQ-7 --- see SRS Section 3.7
// POST /appointments/queue --- called internally after booking is confirmed
router.post('/queue', async (req, res) => {
  const { appointment_id, patient_id } = req.body;
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Get appointment details (doctor_id and date)
    const { rows: apptDetails } = await client.query(
      `SELECT a.doctor_id, s.date, s.start_time
       FROM appointments a
       JOIN schedules s ON s.schedule_id = a.schedule_id
       WHERE a.appointment_id = $1`,
      [appointment_id]
    );

    if (apptDetails.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const { doctor_id, date, start_time } = apptDetails[0];

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
    const estimatedWaitTime = queuePosition * 10; // 10 minutes per position

    const { rows: entry } = await client.query(
      `INSERT INTO queue (appointment_id, queue_position, estimated_wait_time)
       VALUES ($1, $2, $3) RETURNING *`,
      [appointment_id, queuePosition, estimatedWaitTime]
    );

    await client.query('COMMIT');
    res.status(201).json(entry[0]);
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
              a.doctor_id,
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
       WHERE a.patient_id = $1
         AND a.status IN ('Booked', 'Arrived')
       ORDER BY s.date, s.start_time
       LIMIT 1`,
      [patientId]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Not in queue' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Queue fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch queue position' });
  }
});

// Implements: REQ-12 --- see SRS Section 3.12
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

    // Remove from queue if completed or no-show
    if (['Completed', 'No-Show'].includes(status)) {
      await client.query(
        `DELETE FROM queue WHERE appointment_id = $1`,
        [id]
      );
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
