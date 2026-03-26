// Implements: REQ-3 — API rate limiting to prevent brute-force attacks
// See SRS Section 7.4.2 — Input Validation and Attack Prevention

const redisClient = require("../db/redis");

const WINDOW = 15 * 60; // 15 minutes in seconds
const MAX_AUTH_REQUESTS = 100; // auth routes
const MAX_GENERAL_REQUESTS = 300; // all other routes

const rateLimiter = (maxRequests) => async (req, res, next) => {
  try {
    const ip = req.ip;
    const key = `rate:${ip}:${req.path}`;

    const requests = await redisClient.incr(key);

    if (requests === 1) {
      await redisClient.expire(key, WINDOW);
    }

    if (requests > maxRequests) {
      return res.status(429).json({
        error: "Too many requests. Please try again later.",
      });
    }

    next();
  } catch (err) {
    // Fail open — don't block requests if Redis is down
    console.error("Rate limiter error:", err);
    next();
  }
};

// Usage:
// app.use('/auth', rateLimiter(MAX_AUTH_REQUESTS), authRouter);
// app.use('/api', rateLimiter(MAX_GENERAL_REQUESTS), apiRouter);

module.exports = { rateLimiter, MAX_AUTH_REQUESTS, MAX_GENERAL_REQUESTS };
