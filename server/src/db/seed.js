const db = require('./connection');

// Implements: Demo seed data --- doctors, patients, appointments, queue entries
async function seed() {
  console.log('Seeding database...');

  // Seed Doctors
  await db.query(
    INSERT INTO Doctors (name, specialty, email) VALUES
    ('Dr. Aryan Mehta', 'Cardiology', 'aryan@demo.com'),
    ('Dr. Priya Sharma', 'Dermatology', 'priya@demo.com'),
    ('Dr. Rohan Verma', 'General Medicine', 'rohan@demo.com')
    ON CONFLICT DO NOTHING;
  );

  // Seed Patients
  await db.query(
    INSERT INTO Users (name, email, password, role) VALUES
    ('Patient One', 'patient1@demo.com', 'hashed_pw', 'patient'),
    ('Patient Two', 'patient2@demo.com', 'hashed_pw', 'patient'),
    ('Patient Three', 'patient3@demo.com', 'hashed_pw', 'patient'),
    ('Patient Four', 'patient4@demo.com', 'hashed_pw', 'patient'),
    ('Patient Five', 'patient5@demo.com', 'hashed_pw', 'patient'),
    ('Patient Six', 'patient6@demo.com', 'hashed_pw', 'patient'),
    ('Patient Seven', 'patient7@demo.com', 'hashed_pw', 'patient'),
    ('Patient Eight', 'patient8@demo.com', 'hashed_pw', 'patient'),
    ('Patient Nine', 'patient9@demo.com', 'hashed_pw', 'patient'),
    ('Patient Ten', 'patient10@demo.com', 'hashed_pw', 'patient')
    ON CONFLICT DO NOTHING;
  );

  // Seed Appointments
  await db.query(
    INSERT INTO Appointments (patient_id, doctor_id, schedule_id, status, scheduled_at) VALUES
    (1, 1, 1, 'booked', NOW() + INTERVAL '1 hour'),
    (2, 1, 2, 'booked', NOW() + INTERVAL '2 hours'),
    (3, 2, 3, 'booked', NOW() + INTERVAL '3 hours'),
    (4, 2, 4, 'booked', NOW() + INTERVAL '4 hours'),
    (5, 3, 5, 'booked', NOW() + INTERVAL '5 hours'),
    (6, 3, 6, 'booked', NOW() + INTERVAL '6 hours'),
    (7, 1, 7, 'booked', NOW() + INTERVAL '7 hours'),
    (8, 2, 8, 'booked', NOW() + INTERVAL '8 hours'),
    (9, 3, 9, 'booked', NOW() + INTERVAL '9 hours'),
    (10, 1, 10, 'booked', NOW() + INTERVAL '10 hours')
    ON CONFLICT DO NOTHING;
  );

  // Seed Queue entries
  await db.query(
    INSERT INTO Queue (appointment_id, patient_id, position, status) VALUES
    (1, 1, 1, 'waiting'),
    (2, 2, 2, 'waiting'),
    (3, 3, 3, 'waiting'),
    (4, 4, 4, 'waiting'),
    (5, 5, 5, 'waiting')
    ON CONFLICT DO NOTHING;
  );

  console.log('Seeding complete!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
