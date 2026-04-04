const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// Implements: REQ-5 --- see SRS Section 3.5
// GET /schedules/:doctorId/slots
router.get('/:doctorId/slots', async (req, res) => {
  const { doctorId } = req.params;
  const { date } = req.query;

  const { rows } = await db.query(
    SELECT s.* FROM Schedules s
     WHERE s.doctor_id = 
       AND s.date = 
       AND s.status = 'open'
       AND s.id NOT IN (
         SELECT schedule_id FROM Appointments
         WHERE status NOT IN ('cancelled')
       ),
    [doctorId, date]
  );

  res.json(rows);
});

module.exports = router;
