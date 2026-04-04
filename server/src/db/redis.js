// Redis client — used for token blacklist and login attempt counter
// Implements: REQ-3 (brute-force protection), REQ-1 (session invalidation)

const { createClient } = require("redis");

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => console.error("Redis error:", err));
redisClient.on("connect", () => console.log("Redis connected"));

(async () => {
  await redisClient.connect();
})();

module.exports = redisClient;
