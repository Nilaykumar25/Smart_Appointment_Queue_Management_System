// Implements: Database connection pool
// Used by: all route files (appointments, doctors, slots, scheduleRoutes, cron)
// See SRS Section 7.3 — Database Schema

require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  host:     process.env.DB_HOST     || "localhost",
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || "saqms_db",
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
    console.error("   Check your .env file — DB_HOST, DB_USER, DB_PASSWORD, DB_NAME");
  } else {
    console.log("✅ Database connected successfully");
    release();
  }
});

// Simple query helper — used by most routes
// Usage: const { rows } = await db.query('SELECT * FROM ...', [params])
const query = (text, params) => pool.query(text, params);

// Transaction helper — used by appointments.js for double-booking lock
// Usage: const client = await db.getClient(); then client.query / release()
const getClient = () => pool.connect();

module.exports = { query, getClient };
