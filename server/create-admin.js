require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const bcrypt = require("bcrypt");
const db = require("./src/db/connection");

async function createAdmin() {
  try {
    // Check if admin exists
    const { rows } = await db.query("SELECT email FROM users WHERE role = 'admin'");
    
    if (rows.length > 0) {
      console.log("✅ Admin user already exists:");
      rows.forEach(row => console.log(`   - ${row.email}`));
      process.exit(0);
    }

    // Create admin user
    const email = "admin@demo.com";
    const password = "admin123";
    const name = "Admin User";
    const hash = await bcrypt.hash(password, 12);

    await db.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'admin')",
      [name, email, hash]
    );

    console.log("✅ Admin user created successfully!");
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log("\n⚠️  Please change the password after first login!");
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

createAdmin();
