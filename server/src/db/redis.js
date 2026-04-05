// Redis client — used for token blacklist and login attempt counter
// Implements: REQ-3 (brute-force protection), REQ-1 (session invalidation)

const { createClient } = require("redis");

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
  socket: {
    reconnectStrategy: (retries) => {
      if (retries >= 3) {
        // Stop retrying after 3 attempts — Redis is not available
        console.warn("⚠️  Redis not available — token blacklist disabled (OK for development)");
        return false;
      }
      return 1000; // wait 1 second between retries
    }
  }
});

redisClient.on("error", () => {}); // suppress error spam
redisClient.on("connect", () => console.log("✅ Redis connected"));

// Connect but don't crash if Redis is unavailable
redisClient.connect().catch(() => {});

module.exports = redisClient;
