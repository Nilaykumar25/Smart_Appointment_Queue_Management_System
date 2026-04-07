require("dotenv").config({ path: require("path").resolve(__dirname, "../../../.env") });
const db = require("./connection");

async function seed() {
  console.log("Seeding doctors and schedules...");

  // Seed staff users for doctors
  await db.query(`
    INSERT INTO users (user_id, name, email, password_hash, role) VALUES
      ('d1000000-0000-0000-0000-000000000001', 'Dr. Sarah Anderson',  'sarah.anderson@clinic.com',  'seeded', 'staff'),
      ('d1000000-0000-0000-0000-000000000002', 'Dr. James Mitchell',  'james.mitchell@clinic.com',  'seeded', 'staff'),
      ('d1000000-0000-0000-0000-000000000003', 'Dr. Emily Watson',    'emily.watson@clinic.com',    'seeded', 'staff'),
      ('d1000000-0000-0000-0000-000000000004', 'Dr. Michael Johnson', 'michael.johnson@clinic.com', 'seeded', 'staff'),
      ('d1000000-0000-0000-0000-000000000005', 'Dr. Lisa Chen',       'lisa.chen@clinic.com',       'seeded', 'staff'),
      ('d1000000-0000-0000-0000-000000000006', 'Dr. Robert Williams', 'robert.williams@clinic.com', 'seeded', 'staff'),
      ('d1000000-0000-0000-0000-000000000007', 'Dr. Amanda Foster',   'amanda.foster@clinic.com',   'seeded', 'staff'),
      ('d1000000-0000-0000-0000-000000000008', 'Dr. David Kumar',     'david.kumar@clinic.com',     'seeded', 'staff')
    ON CONFLICT (user_id) DO NOTHING
  `);
  console.log("✅ Users seeded");

  // Seed doctors
  await db.query(`
    INSERT INTO doctors (doctor_id, user_id, name, specialty) VALUES
      ('a1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'Dr. Sarah Anderson',  'Cardiology'),
      ('a1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002', 'Dr. James Mitchell',  'Orthopedics'),
      ('a1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000003', 'Dr. Emily Watson',    'Neurology'),
      ('a1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000004', 'Dr. Michael Johnson', 'Dermatology'),
      ('a1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000005', 'Dr. Lisa Chen',       'Pediatrics'),
      ('a1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000006', 'Dr. Robert Williams', 'Ophthalmology'),
      ('a1000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000007', 'Dr. Amanda Foster',   'General Practice'),
      ('a1000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000008', 'Dr. David Kumar',     'Psychiatry')
    ON CONFLICT (doctor_id) DO NOTHING
  `);
  console.log("✅ Doctors seeded");

  // Seed schedules for the next 7 days for each doctor
  const doctorIds = [
    'a1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000004',
    'a1000000-0000-0000-0000-000000000005',
    'a1000000-0000-0000-0000-000000000006',
    'a1000000-0000-0000-0000-000000000007',
    'a1000000-0000-0000-0000-000000000008',
  ];

  const timeSlots = [
    ['09:00', '09:30'], ['09:30', '10:00'], ['10:00', '10:30'], ['10:30', '11:00'],
    ['11:00', '11:30'], ['14:00', '14:30'], ['14:30', '15:00'], ['15:00', '15:30'],
    ['15:30', '16:00'], ['16:00', '16:30'],
  ];

  let scheduleCount = 0;
  for (let d = 1; d <= 7; d++) {
    const date = new Date();
    date.setDate(date.getDate() + d);
    const dateStr = date.toISOString().split('T')[0];

    for (const doctorId of doctorIds) {
      for (const [start, end] of timeSlots) {
        await db.query(
          `INSERT INTO schedules (doctor_id, date, start_time, end_time, slot_duration, is_blackout)
           VALUES ($1, $2, $3, $4, 30, FALSE)
           ON CONFLICT DO NOTHING`,
          [doctorId, dateStr, start, end]
        );
        scheduleCount++;
      }
    }
  }
  console.log(`✅ ${scheduleCount} schedule slots seeded`);
  process.exit(0);
}

seed().catch(err => {
  console.error("Seed error:", err);
  process.exit(1);
});
