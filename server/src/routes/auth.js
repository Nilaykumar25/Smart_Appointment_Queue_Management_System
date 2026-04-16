// Implements: REQ-1 (role-based access), REQ-2 (data encryption)
// See SRS Section 4 — User Registration and Authentication

require("dotenv").config({ path: require("path").resolve(__dirname, "../../../.env") });
const express      = require("express");
const bcrypt       = require("bcrypt");
const jwt          = require("jsonwebtoken");
const router       = express.Router();
const db           = require("../db/connection");
const redisClient  = require("../db/redis");
const loginLimiter = require("../middleware/loginLimiter");

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role = "patient" } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: "Name, email and password are required" });

    if (!["patient", "staff", "admin"].includes(role))
      return res.status(400).json({ error: "Invalid role" });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: "Invalid email format" });

    if (password.length < 8)
      return res.status(400).json({ error: "Password must be at least 8 characters" });

    // Check duplicate email
    const existing = await db.query("SELECT user_id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0)
      return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 12);

    const { rows } = await db.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4) RETURNING user_id, name, email, role`,
      [name, email, passwordHash, role]
    );

    const user = rows[0];

    // Issue tokens immediately on register so user is logged in
    const accessToken = jwt.sign(
      { userId: user.user_id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || "15m" }
    );

    const refreshToken = jwt.sign(
      { userId: user.user_id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" }
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge:   7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      accessToken,
      userId: user.user_id,
      role:   user.role,
      name:   user.name,
    });
  } catch (err) {
    console.error("POST /auth/register error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login — JWT access token + httpOnly refresh token
// Implements: REQ-1, REQ-3
// loginLimiter attaches req.loginSuccess / req.loginFailed helpers
// ─────────────────────────────────────────────────────────────────────────────
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const result = await db.query(
      "SELECT user_id, name, email, password_hash, role, is_active FROM users WHERE email = $1",
      [email]
    );
    const user = result.rows[0];

    if (!user) {
      if (req.loginFailed) await req.loginFailed();
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: "Account is deactivated" });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      if (req.loginFailed) await req.loginFailed();
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (req.loginSuccess) await req.loginSuccess();

    // Sign access token — includes name so frontend can decode it
    const accessToken = jwt.sign(
      { userId: user.user_id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || "15m" }
    );

    const refreshToken = jwt.sign(
      { userId: user.user_id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" }
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge:   7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ accessToken });
  } catch (err) {
    console.error("POST /auth/login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout — invalidate both tokens immediately
// Implements: REQ-1 (session management)
// ─────────────────────────────────────────────────────────────────────────────
router.post("/logout", async (req, res) => {
  try {
    const authHeader   = req.headers.authorization;
    const refreshToken = req.cookies?.refreshToken;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const accessToken = authHeader.split(" ")[1];
      try {
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await redisClient.set(`blacklist:${accessToken}`, "1", { EX: ttl });
        }
      } catch { /* already expired */ }
    }

    if (refreshToken) {
      await redisClient.set(`blacklist:${refreshToken}`, "1", { EX: 7 * 24 * 60 * 60 });
    }

    res.clearCookie("refreshToken");
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("POST /auth/logout error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
