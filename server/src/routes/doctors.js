const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// Implements: REQ-4 --- see SRS Section 3.4
// GET /doctors?name=&specialty=
router.get('/', async (req, res) => {
  const { name, specialty } = req.query;
  let query = 'SELECT * FROM Doctors WHERE 1=1';
  const params = [];

  if (name) {
    params.push(%%);
    query +=  AND name ILIKE File{params.length};
  }
  if (specialty) {
    params.push(specialty);
    query +=  AND specialty = File{params.length};
  }

  const { rows } = await db.query(query, params);
  res.json(rows);
});

module.exports = router;
