const cron = require('node-cron');
const db = require('./db/connection');

// Implements: REQ-13 --- see SRS Section 3.13
// Auto-flag No-Show if patient unchecked after 15 min
cron.schedule('* * * * *', async () => {
  try {
    const { rows } = await db.query(
      SELECT * FROM Appointments
       WHERE status = 'booked'
         AND scheduled_at < NOW() - INTERVAL '15 minutes'
    );

    for (const appt of rows) {
      await db.query(
        UPDATE Appointments SET status = 'no-show' WHERE id = ,
        [appt.id]
      );

      await db.query(
        UPDATE Queue SET status = 'no-show' WHERE appointment_id = ,
        [appt.id]
      );

      console.log('Auto-flagged no-show for appointment:', appt.id);
    }
  } catch (err) {
    console.error('No-show cron error:', err);
  }
});

console.log('No-show cron job running...');
