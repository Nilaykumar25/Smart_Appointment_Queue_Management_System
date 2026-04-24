const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { dateStringToIST } = require('../utils/timezone');

// Implements: REQ-5 --- see SRS Section 3.5
// Enhanced: REQ-9 --- Validate slots against facility operating hours
// Enhanced: Multiple patients per slot (max 3) with capacity tracking
// GET /schedules/:doctorId/slots?date=YYYY-MM-DD
router.get('/:doctorId/slots', async (req, res) => {
  const { doctorId } = req.params;
  const { date } = req.query;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'date query parameter is required (YYYY-MM-DD)' });
  }

  try {
    // Get day of week for the requested date using consistent IST calculation
    const istDate = dateStringToIST(date);
    const dayOfWeek = (istDate.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0 format

    // Fetch all slots with capacity information
    const { rows } = await db.query(
      `SELECT 
         s.schedule_id, 
         s.doctor_id, 
         s.date, 
         s.start_time, 
         s.end_time, 
         s.slot_duration,
         s.max_capacity,
         COALESCE(booked.count, 0) as current_bookings,
         (s.max_capacity - COALESCE(booked.count, 0)) as available_spots
       FROM schedules s
       JOIN facility_config fc ON fc.day_of_week = $3
       LEFT JOIN (
         SELECT schedule_id, COUNT(*) as count
         FROM appointments
         WHERE status NOT IN ('Completed', 'No-Show')
         GROUP BY schedule_id
       ) booked ON booked.schedule_id = s.schedule_id
       WHERE s.doctor_id = $1
         AND s.date = $2
         AND s.is_blackout = FALSE
         AND fc.is_operational = TRUE
         AND s.start_time >= fc.start_time
         AND s.end_time <= fc.end_time
         AND (s.max_capacity - COALESCE(booked.count, 0)) > 0
       ORDER BY s.start_time`,
      [doctorId, date, dayOfWeek]
    );

    // Format the response to include capacity information
    const slotsWithCapacity = rows.map(slot => ({
      schedule_id: slot.schedule_id,
      doctor_id: slot.doctor_id,
      date: slot.date,
      start_time: slot.start_time,
      end_time: slot.end_time,
      slot_duration: slot.slot_duration,
      capacity: {
        maximum: slot.max_capacity,
        current: slot.current_bookings,
        available: slot.available_spots
      }
    }));

    res.json(slotsWithCapacity);
  } catch (err) {
    console.error('Slots fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
});

module.exports = router;
