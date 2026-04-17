require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const bcrypt = require("bcrypt");
const db = require("./src/db/connection");

async function createStaff() {
  try {
    const staffEmail = "staff@demo.com";
    const staffPassword = "staff123";
    const staffName = "Staff User";
    
    // Check if staff exists
    const { rows } = await db.query("SELECT user_id FROM users WHERE email = $1", [staffEmail]);
    
    if (rows.length > 0) {
      // Update existing staff password
      const hash = await bcrypt.hash(staffPassword, 12);
      await db.query(
        "UPDATE users SET password_hash = $1, name = $2, role = 'staff' WHERE email = $3",
        [hash, staffName, staffEmail]
      );
      console.log("✅ Staff user password reset successfully!");
      console.log(`   Email: ${staffEmail}`);
      console.log(`   Password: ${staffPassword}`);
    } else {
      // Create new staff user
      const hash = await bcrypt.hash(staffPassword, 12);
      await db.query(
        "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'staff')",
        [staffName, staffEmail, hash]
      );
      console.log("✅ Staff user created successfully!");
      console.log(`   Email: ${staffEmail}`);
      console.log(`   Password: ${staffPassword}`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

createStaff();
