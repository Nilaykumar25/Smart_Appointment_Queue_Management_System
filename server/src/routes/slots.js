const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// Implements: REQ-5 --- see SRS Section 3.5
// GET /schedules/:doctorId/slots?date=YYYY-MM-DD
router.get('/:doctorId/slots', async (req, res) => {
  const { doctorId } = req.params;
  const { date } = req.query;

  try {
    const { rows } = await db.query(
      `SELECT s.schedule_id, s.doctor_id, s.date, s.start_time, s.end_time, s.slot_duration
       FROM schedules s
       WHERE s.doctor_id = $1
         AND s.date = $2
         AND s.is_blackout = FALSE
         AND s.schedule_id NOT IN (
           SELECT schedule_id FROM appointments
           WHERE status NOT IN ('Completed', 'No-Show')
         )
       ORDER BY s.start_time`,
      [doctorId, date]
    );

    res.json(rows);
  } catch (err) {
    console.error('Slots fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
});

module.exports = router;
