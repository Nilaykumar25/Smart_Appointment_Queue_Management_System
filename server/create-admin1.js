require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const bcrypt = require("bcrypt");
const db = require("./src/db/connection");

async function createAdmin1() {
  try {
    const email = "admin1@demo.com";
    const password = "admin1234";
    const name = "Admin User 1";
    
    // Check if admin1 exists
    const { rows } = await db.query("SELECT user_id FROM users WHERE email = $1", [email]);
    
    if (rows.length > 0) {
      // Update existing admin1 password
      const hash = await bcrypt.hash(password, 12);
      await db.query(
        "UPDATE users SET password_hash = $1, name = $2, role = $3, is_active = $4 WHERE email = $5",
        [hash, name, 'admin', true, email]
      );
      console.log("✅ Admin1 user password reset successfully!");
    } else {
      // Create new admin1 user
      const hash = await bcrypt.hash(password, 12);
      await db.query(
        "INSERT INTO users (name, email, password_hash, role, is_active) VALUES ($1, $2, $3, $4, $5)",
        [name, email, hash, 'admin', true]
      );
      console.log("✅ Admin1 user created successfully!");
    }
    
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

createAdmin1();
