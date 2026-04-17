require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const bcrypt = require("bcrypt");
const db = require("./src/db/connection");

async function resetCredentials() {
  try {
    // Reset admin
    const adminHash = await bcrypt.hash("admin123", 12);
    await db.query(
      `UPDATE users 
       SET password_hash = $1, name = 'Admin User', role = 'admin', is_active = TRUE 
       WHERE email = 'admin@demo.com'`,
      [adminHash]
    );
    console.log("✅ Admin credentials reset:");
    console.log("   Email: admin@demo.com");
    console.log("   Password: admin123\n");

    // Reset staff
    const staffHash = await bcrypt.hash("staff123", 12);
    await db.query(
      `UPDATE users 
       SET password_hash = $1, name = 'Staff User', role = 'staff', is_active = TRUE 
       WHERE email = 'staff@demo.com'`,
      [staffHash]
    );
    console.log("✅ Staff credentials reset:");
    console.log("   Email: staff@demo.com");
    console.log("   Password: staff123\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

resetCredentials();
