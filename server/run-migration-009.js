// Script to run migration 009 - create facility_config table
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const fs = require("fs");
const db = require("./src/db/connection");

async function runMigration() {
  try {
    console.log("Running migration 009: create_facility_config...");
    
    // Read the migration file
    const migrationSQL = fs.readFileSync(
      require("path").resolve(__dirname, "./src/db/migrations/009_create_facility_config.sql"),
      "utf8"
    );
    
    // Execute the migration
    await db.query(migrationSQL);
    
    console.log("✅ Migration 009 completed successfully!");
    console.log("✅ facility_config table created and initialized");
    
    // Verify the data
    const { rows } = await db.query("SELECT * FROM facility_config ORDER BY day_of_week");
    console.log(`✅ Found ${rows.length} days configured`);
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    console.error(err);
    process.exit(1);
  }
}

runMigration();
