const cron = require('node-cron');
const db = require('./db/connection');

// Implements: REQ-13 --- see SRS Section 3.13
// Auto-flag No-Show if patient unchecked after 15 min
cron.schedule('* * * * *', async () => {
  try {
    const { rows } = await db.query(
      `SELECT a.appointment_id, a.patient_id
       FROM appointments a
       JOIN schedules s ON s.schedule_id = a.schedule_id
       WHERE a.status = 'Booked'
         AND (s.date + s.start_time) < NOW() - INTERVAL '15 minutes'`
    );

    for (const appt of rows) {
      await db.query(
        `UPDATE appointments SET status = 'No-Show' WHERE appointment_id = $1`,
        [appt.appointment_id]
      );

      await db.query(
        `DELETE FROM queue WHERE appointment_id = $1`,
        [appt.appointment_id]
      );

      console.log('Auto-flagged no-show for appointment:', appt.appointment_id);
    }
  } catch (err) {
    console.error('No-show cron error:', err);
  }
});

console.log('No-show cron job running...');
