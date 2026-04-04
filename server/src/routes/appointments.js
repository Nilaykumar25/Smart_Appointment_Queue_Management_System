const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// Implements: REQ-5 --- see SRS Section 3.5
// POST /appointments --- DB-level lock prevents double booking
router.post('/', async (req, res) => {
  const { patient_id, doctor_id, schedule_id } = req.body;
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    const { rows: slot } = await client.query(
      SELECT * FROM Schedules WHERE id =  AND status = 'open' FOR UPDATE,
      [schedule_id]
    );

    if (slot.length === 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Slot no longer available' });
    }

    const { rows: appt } = await client.query(
      INSERT INTO Appointments (patient_id, doctor_id, schedule_id, status)
       VALUES (, , , 'booked') RETURNING *,
      [patient_id, doctor_id, schedule_id]
    );

    await client.query(
      UPDATE Schedules SET status = 'booked' WHERE id = ,
      [schedule_id]
    );

    await client.query('COMMIT');
    res.status(201).json(appt[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Booking failed' });
  } finally {
    client.release();
  }
});

module.exports = router;

// Implements: REQ-7 --- see SRS Section 3.7
// POST /queue --- called internally after booking is confirmed
router.post('/queue', async (req, res) => {
  const { appointment_id, patient_id } = req.body;
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    const { rows: pos } = await client.query(
      SELECT COUNT(*) AS position FROM Queue WHERE status = 'waiting'
    );

    const { rows: entry } = await client.query(
      INSERT INTO Queue (appointment_id, patient_id, position, status)
       VALUES (, , , 'waiting') RETURNING *,
      [appointment_id, patient_id, parseInt(pos[0].position) + 1]
    );

    await client.query('COMMIT');
    res.status(201).json(entry[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Queue entry failed' });
  } finally {
    client.release();
  }
});

// Implements: REQ-7, REQ-8 --- see SRS Section 3.7, 3.8
// GET /queue/:patientId
router.get('/queue/:patientId', async (req, res) => {
  const { patientId } = req.params;

  const { rows } = await db.query(
    SELECT q.position,
            (SELECT COUNT(*) FROM Queue WHERE position < q.position AND status = 'waiting') AS ahead,
            (SELECT COUNT(*) * 10 FROM Queue WHERE position < q.position AND status = 'waiting') AS estimated_wait_minutes
     FROM Queue q
     WHERE q.patient_id =  AND q.status = 'waiting',
    [patientId]
  );

  if (rows.length === 0) return res.status(404).json({ error: 'Not in queue' });
  res.json(rows[0]);
});

// Implements: REQ-12 --- see SRS Section 3.12
// PATCH /appointments/:id/status
router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    const { rows: appt } = await client.query(
      UPDATE Appointments SET status =  WHERE id =  RETURNING *,
      [status, id]
    );

    if (appt.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Appointment not found' });
    }

    await client.query(
      DELETE FROM Queue WHERE appointment_id = , [id]
    );
    await client.query(
      UPDATE Queue SET position = position - 1
       WHERE status = 'waiting' AND position > (
         SELECT COALESCE(MIN(position), 0) FROM Queue WHERE appointment_id = 
       ), [id]
    );

    await client.query('COMMIT');
    res.json({ message: 'Status updated, queue recalculated', appointment: appt[0] });
  } catch (err) {
    await client.query('ROLLBACK');
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
      SELECT * FROM Appointments WHERE id = , [id]
    );

    if (appt.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const appointmentTime = new Date(appt[0].scheduled_at);
    const now = new Date();
    const diffHours = (appointmentTime - now) / (1000 * 60 * 60);

    if (diffHours < 2) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cannot reschedule within 2 hours of appointment' });
    }

    await client.query(
      UPDATE Appointments SET schedule_id = , status = 'booked' WHERE id = ,
      [new_schedule_id, id]
    );

    await client.query('COMMIT');
    res.json({ message: 'Appointment rescheduled successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
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
      SELECT * FROM Appointments WHERE id = , [id]
    );

    if (appt.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const appointmentTime = new Date(appt[0].scheduled_at);
    const now = new Date();
    const diffHours = (appointmentTime - now) / (1000 * 60 * 60);

    if (diffHours < 2) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cannot cancel within 2 hours of appointment' });
    }

    await client.query(
      UPDATE Appointments SET status = 'cancelled' WHERE id = , [id]
    );

    await client.query(
      DELETE FROM Queue WHERE appointment_id = , [id]
    );

    await client.query('COMMIT');
    res.json({ message: 'Appointment cancelled successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Cancellation failed' });
  } finally {
    client.release();
  }
});
