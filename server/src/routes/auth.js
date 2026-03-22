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

// POST /auth/login — returns JWT access token + httpOnly refresh token
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // TODO: fetch user from DB
    // const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    // const user = result.rows[0];
    // if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    // Verify password
    // const valid = await bcrypt.compare(password, user.password_hash);
    // if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    // Issue JWT access token (15 min expiry)
    // const accessToken = jwt.sign(
    //   { userId: user.user_id, role: user.role },
    //   process.env.JWT_SECRET,
    //   { expiresIn: process.env.JWT_EXPIRY }
    // );

    // Issue refresh token (7 days) — stored in httpOnly cookie
    // const refreshToken = jwt.sign(
    //   { userId: user.user_id },
    //   process.env.REFRESH_TOKEN_SECRET,
    //   { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    // );

    // res.cookie('refreshToken', refreshToken, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === 'production',
    //   sameSite: 'Strict',
    //   maxAge: 7 * 24 * 60 * 60 * 1000
    // });

    // return res.status(200).json({ accessToken });

    return res.status(200).json({ message: "Login endpoint ready" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
