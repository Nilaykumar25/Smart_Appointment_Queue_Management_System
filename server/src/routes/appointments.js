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
