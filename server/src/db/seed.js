require("dotenv").config({ path: require("path").resolve(__dirname, "../../../.env") });
const bcrypt = require("bcrypt");
const db = require("./connection");

// Implements: Demo seed data — doctors, patients, appointments, queue entries
async function seed() {
  console.log("Seeding database...");

  // Seed staff users for doctors
  await db.query(`
    INSERT INTO users (user_id, name, email, password_hash, role) VALUES
      ('d1000000-0000-0000-0000-000000000001', 'Dr. Aryan Mehta',  'aryan@demo.com',  'seeded', 'staff'),
      ('d1000000-0000-0000-0000-000000000002', 'Dr. Priya Sharma', 'priya@demo.com',  'seeded', 'staff'),
      ('d1000000-0000-0000-0000-000000000003', 'Dr. Rohan Verma',  'rohan@demo.com',  'seeded', 'staff')
    ON CONFLICT (user_id) DO NOTHING
  `);
  console.log("✅ Doctor users seeded");

  // Seed doctors
  await db.query(`
    INSERT INTO doctors (doctor_id, user_id, name, specialty) VALUES
      ('a1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'Dr. Aryan Mehta',  'Cardiology'),
      ('a1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002', 'Dr. Priya Sharma', 'Dermatology'),
      ('a1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000003', 'Dr. Rohan Verma',  'General Medicine')
    ON CONFLICT (doctor_id) DO NOTHING
  `);
  console.log("✅ Doctors seeded");

  // Seed patients (hashed password: "password123")
  const hash = await bcrypt.hash("password123", 12);
  for (let i = 1; i <= 10; i++) {
    await db.query(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, 'patient')
      ON CONFLICT (email) DO NOTHING
    `, [`Patient ${i}`, `patient${i}@demo.com`, hash]);
  }
  console.log("✅ Patients seeded");

  // Fetch patient IDs
  const { rows: patients } = await db.query(`
    SELECT user_id FROM users WHERE role = 'patient' AND email LIKE 'patient%@demo.com'
    ORDER BY created_at LIMIT 10
  `);

  // Seed schedules for next 3 days for each doctor
  const timeSlots = [
    ["09:00", "09:30"], ["09:30", "10:00"], ["10:00", "10:30"],
    ["10:30", "11:00"], ["14:00", "14:30"], ["14:30", "15:00"],
  ];
  const doctorIds = [
    "a1000000-0000-0000-0000-000000000001",
    "a1000000-0000-0000-0000-000000000002",
    "a1000000-0000-0000-0000-000000000003",
  ];

  const scheduleIds = [];
  for (let d = 1; d <= 3; d++) {
    const date = new Date();
    date.setDate(date.getDate() + d);
    const dateStr = date.toISOString().split("T")[0];
    for (const doctorId of doctorIds) {
      for (const [start, end] of timeSlots) {
        const { rows } = await db.query(`
          INSERT INTO schedules (doctor_id, date, start_time, end_time, slot_duration, is_blackout)
          VALUES ($1, $2, $3, $4, 30, FALSE)
          ON CONFLICT DO NOTHING
          RETURNING schedule_id
        `, [doctorId, dateStr, start, end]);
        if (rows[0]) scheduleIds.push({ schedule_id: rows[0].schedule_id, doctor_id: doctorId });
      }
    }
  }
  console.log(`✅ ${scheduleIds.length} schedule slots seeded`);

  // Seed appointments (first 10 slots, one per patient)
  const apptIds = [];
  for (let i = 0; i < Math.min(10, patients.length, scheduleIds.length); i++) {
    const { rows } = await db.query(`
      INSERT INTO appointments (patient_id, doctor_id, schedule_id, status)
      VALUES ($1, $2, $3, 'Booked')
      ON CONFLICT DO NOTHING
      RETURNING appointment_id
    `, [patients[i].user_id, scheduleIds[i].doctor_id, scheduleIds[i].schedule_id]);
    if (rows[0]) apptIds.push(rows[0].appointment_id);
  }
  console.log(`✅ ${apptIds.length} appointments seeded`);

  // Seed queue entries
  for (let i = 0; i < apptIds.length; i++) {
    await db.query(`
      INSERT INTO queue (appointment_id, queue_position, estimated_wait_time)
      VALUES ($1, $2, $3)
      ON CONFLICT DO NOTHING
    `, [apptIds[i], i + 1, (i + 1) * 10]);
  }
  console.log(`✅ ${apptIds.length} queue entries seeded`);

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seed error:", err);
  process.exit(1);
});
