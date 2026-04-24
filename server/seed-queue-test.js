require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const db = require("./src/db/connection");

async function seedQueueTest() {
  try {
    console.log("🔄 Adding test appointments with queue entries for 2026-04-17...");

    // Step 1: Get existing patients
    const { rows: patients } = await db.query(`
      SELECT user_id, name, email 
      FROM users 
      WHERE role = 'patient' 
      LIMIT 2
    `);

    if (patients.length < 2) {
      console.error("❌ Need at least 2 patients in database");
      process.exit(1);
    }

    console.log(`✅ Found patients: ${patients[0].email}, ${patients[1].email}`);

    // Step 2: Get an existing doctor
    const { rows: doctors } = await db.query(`
      SELECT doctor_id, name 
      FROM doctors 
      LIMIT 1
    `);

    if (doctors.length === 0) {
      console.error("❌ No doctors found in database");
      process.exit(1);
    }

    const doctor = doctors[0];
    console.log(`✅ Using doctor: ${doctor.name}`);

    // Step 3: Create schedules for 2026-04-17
    const date = '2026-04-17';
    const timeSlots = [
      { start: '09:00:00', end: '09:30:00' },
      { start: '09:30:00', end: '10:00:00' }
    ];

    const scheduleIds = [];

    for (const slot of timeSlots) {
      const { rows } = await db.query(`
        INSERT INTO schedules (doctor_id, date, start_time, end_time, slot_duration, is_blackout)
        VALUES ($1, $2, $3, $4, 30, FALSE)
        ON CONFLICT DO NOTHING
        RETURNING schedule_id
      `, [doctor.doctor_id, date, slot.start, slot.end]);

      if (rows.length > 0) {
        scheduleIds.push(rows[0].schedule_id);
        console.log(`✅ Created schedule: ${date} ${slot.start}-${slot.end}`);
      } else {
        // Schedule already exists, fetch it
        const { rows: existing } = await db.query(`
          SELECT schedule_id 
          FROM schedules 
          WHERE doctor_id = $1 AND date = $2 AND start_time = $3
        `, [doctor.doctor_id, date, slot.start]);
        
        if (existing.length > 0) {
          scheduleIds.push(existing[0].schedule_id);
          console.log(`✅ Using existing schedule: ${date} ${slot.start}-${slot.end}`);
        }
      }
    }

    if (scheduleIds.length < 2) {
      console.error("❌ Failed to create/find schedules");
      process.exit(1);
    }

    // Step 4: Create appointments (or use existing ones)
    const appointmentIds = [];

    for (let i = 0; i < 2; i++) {
      // First check if appointment already exists
      const { rows: existing } = await db.query(`
        SELECT appointment_id 
        FROM appointments 
        WHERE doctor_id = $1 AND schedule_id = $2
      `, [doctor.doctor_id, scheduleIds[i]]);

      let appointmentId;

      if (existing.length > 0) {
        appointmentId = existing[0].appointment_id;
        console.log(`✅ Using existing appointment for ${patients[i].name}`);
      } else {
        const { rows } = await db.query(`
          INSERT INTO appointments (patient_id, doctor_id, schedule_id, status)
          VALUES ($1, $2, $3, 'Booked')
          RETURNING appointment_id
        `, [patients[i].user_id, doctor.doctor_id, scheduleIds[i]]);

        appointmentId = rows[0].appointment_id;
        console.log(`✅ Created appointment for ${patients[i].name}`);
      }

      appointmentIds.push(appointmentId);
    }

    // Step 5: Create queue entries
    for (let i = 0; i < appointmentIds.length; i++) {
      const queuePosition = i + 1;
      const estimatedWaitTime = queuePosition * 10; // 10 minutes per position

      await db.query(`
        INSERT INTO queue (appointment_id, queue_position, estimated_wait_time)
        VALUES ($1, $2, $3)
        ON CONFLICT (appointment_id) DO UPDATE 
        SET queue_position = $2, estimated_wait_time = $3
      `, [appointmentIds[i], queuePosition, estimatedWaitTime]);

      console.log(`✅ Added to queue: Position ${queuePosition}, Wait time ${estimatedWaitTime} min`);
    }

    console.log("\n✅ Successfully added 2 appointments with queue entries!");
    console.log("\nTest Data Summary:");
    console.log(`- Date: ${date}`);
    console.log(`- Doctor: ${doctor.name}`);
    console.log(`- Patient 1: ${patients[0].name} (${patients[0].email}) - Position 1, 10 min wait`);
    console.log(`- Patient 2: ${patients[1].name} (${patients[1].email}) - Position 2, 20 min wait`);
    console.log("\nYou can now login as these patients to see their queue status!");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    console.error(err);
    process.exit(1);
  }
}

seedQueueTest();
