const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const requireRole = require('../middleware/requireRole');

// Implements: REQ-4 --- see SRS Section 3.4
// GET /doctors?name=&specialty=
router.get('/', async (req, res) => {
  const { name, specialty } = req.query;
  let query = 'SELECT doctor_id, user_id, name, specialty, avg_consultation_duration FROM doctors WHERE 1=1';
  const params = [];

  if (name) {
    params.push(`%${name}%`);
    query += ` AND name ILIKE $${params.length}`;
  }
  if (specialty) {
    params.push(specialty);
    query += ` AND specialty = $${params.length}`;
  }

  try {
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Doctor search error:', err);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

// PATCH /doctors/:id/consultation-duration — update avg consultation duration (REQ-8)
router.patch('/:id/consultation-duration', requireRole(['admin']), async (req, res) => {
  const { id } = req.params;
  const { avg_consultation_duration } = req.body;

  if (!avg_consultation_duration || avg_consultation_duration < 5 || avg_consultation_duration > 120) {
    return res.status(400).json({ error: 'avg_consultation_duration must be between 5 and 120 minutes' });
  }

  try {
    const { rows } = await db.query(
      `UPDATE doctors SET avg_consultation_duration = $1 WHERE doctor_id = $2 RETURNING *`,
      [avg_consultation_duration, id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Doctor not found' });
    res.json({ message: 'Consultation duration updated', doctor: rows[0] });
  } catch (err) {
    console.error('Update consultation duration error:', err);
    res.status(500).json({ error: 'Failed to update consultation duration' });
  }
});

module.exports = router;
