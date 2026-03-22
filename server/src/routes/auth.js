// Implements: REQ-1 (role-based access), REQ-2 (data encryption)
// See SRS Section 4 — User Registration and Authentication

const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();

// POST /auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Input validation
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email and password are required" });
    }

    if (!["patient", "staff", "admin"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    // bcrypt hashing — work factor 12 (REQ-2)
    const passwordHash = await bcrypt.hash(password, 12);

    // TODO: insert into users table (DB connection in next commit)
    // const user = await db.query(
    //   'INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING user_id',
    //   [name, email, passwordHash, role]
    // );

    return res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
