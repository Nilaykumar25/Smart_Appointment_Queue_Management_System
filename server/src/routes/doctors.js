const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// Implements: REQ-4 --- see SRS Section 3.4
// GET /doctors?name=&specialty=
router.get('/', async (req, res) => {
  const { name, specialty } = req.query;
  let query = 'SELECT * FROM doctors WHERE 1=1';
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

module.exports = router;
