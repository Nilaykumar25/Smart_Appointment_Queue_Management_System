// Script to verify and initialize facility_config table
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const db = require("./src/db/connection");

async function verifyFacilityConfig() {
  try {
    console.log("Checking facility_config table...");
    
    // Check if table exists
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'facility_config'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.error("❌ facility_config table does not exist!");
      console.log("Run the migration: server/src/db/migrations/009_create_facility_config.sql");
      process.exit(1);
    }
    
    console.log("✅ facility_config table exists");
    
    // Check if data exists
    const { rows } = await db.query("SELECT * FROM facility_config ORDER BY day_of_week");
    
    if (rows.length === 0) {
      console.log("⚠️  No data in facility_config, initializing...");
      
      // Initialize with default hours
      await db.query(`
        INSERT INTO facility_config (day_of_week, start_time, end_time, is_operational)
        VALUES
          (0, '09:00'::TIME, '17:00'::TIME, TRUE),   -- Monday
          (1, '09:00'::TIME, '17:00'::TIME, TRUE),   -- Tuesday
          (2, '09:00'::TIME, '17:00'::TIME, TRUE),   -- Wednesday
          (3, '09:00'::TIME, '17:00'::TIME, TRUE),   -- Thursday
          (4, '09:00'::TIME, '17:00'::TIME, TRUE),   -- Friday
          (5, '09:00'::TIME, '17:00'::TIME, FALSE),  -- Saturday (closed)
          (6, '09:00'::TIME, '17:00'::TIME, FALSE)   -- Sunday (closed)
        ON CONFLICT (day_of_week) DO NOTHING;
      `);
      
      console.log("✅ Initialized facility_config with default hours");
    } else {
      console.log(`✅ Found ${rows.length} days configured:`);
      const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      rows.forEach(row => {
        console.log(`   ${dayNames[row.day_of_week]}: ${row.start_time} - ${row.end_time} (${row.is_operational ? 'Open' : 'Closed'})`);
      });
    }
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    console.error(err);
    process.exit(1);
  }
}

verifyFacilityConfig();
