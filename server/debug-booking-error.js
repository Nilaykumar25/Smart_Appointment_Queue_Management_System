const db = require('./src/db/connection');

async function debugBookingError() {
  try {
    console.log('=== DEBUGGING BOOKING API ERROR ===\n');
    
    // Test a simple booking scenario
    const testData = {
      patient_id: 'c892c32e-0b2f-445e-a7a9-c10d7936c277',
      doctor_id: 'a1000000-0000-0000-0000-000000000001',
      schedule_id: 'test-schedule-id'
    };
    
    console.log('1. Testing database connection...');
    const { rows: testQuery } = await db.query('SELECT NOW() as current_time');
    console.log('✅ Database connected:', testQuery[0].current_time);
    
    console.log('\n2. Checking if user exists...');
    const { rows: user } = await db.query(
      'SELECT user_id, name, email FROM users WHERE user_id = $1',
      [testData.patient_id]
    );
    
    if (user.length === 0) {
      console.log('❌ User not found:', testData.patient_id);
    } else {
      console.log('✅ User found:', user[0].name, user[0].email);
    }
    
    console.log('\n3. Checking if doctor exists...');
    const { rows: doctor } = await db.query(
      'SELECT doctor_id, name, specialty FROM doctors WHERE doctor_id = $1',
      [testData.doctor_id]
    );
    
    if (doctor.length === 0) {
      console.log('❌ Doctor not found:', testData.doctor_id);
    } else {
      console.log('✅ Doctor found:', doctor[0].name, doctor[0].specialty);
    }
    
    console.log('\n4. Checking available schedules...');
    const { rows: schedules } = await db.query(
      `SELECT 
         schedule_id, 
         TO_CHAR(date, 'YYYY-MM-DD') as date,
         TO_CHAR(start_time, 'HH24:MI') as time,
         max_capacity,
         is_blackout
       FROM schedules 
       WHERE doctor_id = $1 
         AND date >= CURRENT_DATE 
         AND is_blackout = FALSE
       ORDER BY date, start_time 
       LIMIT 5`,
      [testData.doctor_id]
    );
    
    console.log(`Found ${schedules.length} available schedules:`);
    schedules.forEach(s => {
      console.log(`  ${s.date} ${s.time} - ID: ${s.schedule_id} - Capacity: ${s.max_capacity}`);
    });
    
    if (schedules.length > 0) {
      const testSchedule = schedules[0];
      console.log(`\n5. Testing booking logic with schedule: ${testSchedule.schedule_id}`);
      
      // Check current bookings for this schedule
      const { rows: existing } = await db.query(
        `SELECT appointment_id, patient_id, status FROM appointments
         WHERE schedule_id = $1 AND status NOT IN ('Completed', 'No-Show')`,
        [testSchedule.schedule_id]
      );
      
      console.log(`Current bookings for this slot: ${existing.length}/${testSchedule.max_capacity}`);
      existing.forEach(apt => {
        console.log(`  - ${apt.patient_id} (${apt.status}) [${apt.appointment_id}]`);
      });
      
      // Check if user already has booking for this slot
      const userHasBooking = existing.some(apt => apt.patient_id === testData.patient_id);
      console.log(`User already has booking: ${userHasBooking}`);
      
      if (existing.length >= testSchedule.max_capacity) {
        console.log('❌ Slot is full');
      } else if (userHasBooking) {
        console.log('❌ User already has booking for this slot');
      } else {
        console.log('✅ Slot is available for booking');
      }
    }
    
    console.log('\n=== END DEBUG ===');
    process.exit(0);
  } catch (err) {
    console.error('Debug error:', err);
    process.exit(1);
  }
}

debugBookingError();