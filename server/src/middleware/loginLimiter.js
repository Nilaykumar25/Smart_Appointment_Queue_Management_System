// Implements: REQ-3 — Account lockout after 5 failed login attempts
// See SRS Section 7.4.1 — Authentication

const redisClient = require("../db/redis");

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60; // 15 minutes in seconds

const loginLimiter = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) return next();

    const key = `login_attempts:${email}`;
    const lockKey = `locked:${email}`;

    // Check if account is currently locked
    const isLocked = await redisClient.get(lockKey);
    if (isLocked) {
      return res.status(423).json({
        error:
          "Account locked. Too many failed attempts. Try again in 15 minutes.",
      });
    }

    // Attach helpers to req so the login route can call them
    req.loginSuccess = async () => {
      await redisClient.del(key); // reset counter on success
    };

    req.loginFailed = async () => {
      const attempts = await redisClient.incr(key);
      await redisClient.expire(key, LOCKOUT_DURATION);

      if (attempts >= MAX_ATTEMPTS) {
        await redisClient.set(lockKey, "1", { EX: LOCKOUT_DURATION });
        await redisClient.del(key);
      }
    };

    next();
  } catch (err) {
    console.error("Login limiter error:", err);
    next(); // fail open — don't block login if Redis is down
  }
};

module.exports = loginLimiter;
