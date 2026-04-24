require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const bcrypt = require("bcrypt");
const db = require("./src/db/connection");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createNewAdmin() {
  try {
    console.log("=== Create New Admin User ===\n");

    // Get admin details
    const name = await question("Enter admin name: ");
    const email = await question("Enter admin email: ");
    const password = await question("Enter admin password (min 8 characters): ");

    // Validate inputs
    if (!name || name.trim().length < 2) {
      console.error("❌ Name must be at least 2 characters");
      process.exit(1);
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.error("❌ Invalid email format");
      process.exit(1);
    }

    if (!password || password.length < 8) {
      console.error("❌ Password must be at least 8 characters");
      process.exit(1);
    }

    // Check if email already exists
    const { rows: existing } = await db.query(
      "SELECT email FROM users WHERE email = $1",
      [email]
    );

    if (existing.length > 0) {
      console.error(`❌ Email ${email} is already registered`);
      process.exit(1);
    }

    // Hash password
    const hash = await bcrypt.hash(password, 12);

    // Create admin user
    await db.query(
      "INSERT INTO users (name, email, password_hash, role, is_active) VALUES ($1, $2, $3, 'admin', TRUE)",
      [name, email, hash]
    );

    console.log("\n✅ Admin user created successfully!");
    console.log(`   Name: ${name}`);
    console.log(`   Email: ${email}`);
    console.log(`   Role: admin`);
    console.log("\n🔐 You can now login with these credentials!");

    rl.close();
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    rl.close();
    process.exit(1);
  }
}

createNewAdmin();
