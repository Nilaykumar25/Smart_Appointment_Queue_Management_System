// Implements: REQ-15 — Local schedule cache for offline readability
// See SRS Section 4.4 — Clinic Schedule Management

const CACHE_KEY_PREFIX = 'saqms_schedule_';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Cache schedule data locally with expiry timestamp
 * @param {string} doctorId - Doctor identifier
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Array} slots - Array of available time slots
 */
export function cacheSchedule(doctorId, date, slots) {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${doctorId}_${date}`;
    const cacheData = {
      slots,
      timestamp: Date.now(),
      doctorId,
      date
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    console.log(`[REQ-15] Schedule cached for ${doctorId} on ${date}`);
  } catch (err) {
    console.error('[REQ-15] Failed to cache schedule:', err);
  }
}

/**
 * Retrieve cached schedule if available and not expired
 * @param {string} doctorId - Doctor identifier
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Array|null} - Cached slots or null if not available/expired
 */
export function getCachedSchedule(doctorId, date) {
  try {
    const cacheKey = `${CACHE_KEY_PREFIX}${doctorId}_${date}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) return null;
    
    const cacheData = JSON.parse(cached);
    const age = Date.now() - cacheData.timestamp;
    
    // Check if cache is expired
    if (age > CACHE_EXPIRY_MS) {
      localStorage.removeItem(cacheKey);
      console.log(`[REQ-15] Cache expired for ${doctorId} on ${date}`);
      return null;
    }
    
    console.log(`[REQ-15] Using cached schedule for ${doctorId} on ${date}`);
    return cacheData.slots;
  } catch (err) {
    console.error('[REQ-15] Failed to retrieve cached schedule:', err);
    return null;
  }
}

/**
 * Clear all cached schedules
 */
export function clearScheduleCache() {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    console.log('[REQ-15] All schedule caches cleared');
  } catch (err) {
    console.error('[REQ-15] Failed to clear schedule cache:', err);
  }
}

/**
 * Clear expired cache entries
 */
export function cleanExpiredCache() {
  try {
    const keys = Object.keys(localStorage);
    let cleaned = 0;
    
    keys.forEach(key => {
      if (key.startsWith(CACHE_KEY_PREFIX)) {
        const cached = localStorage.getItem(key);
        if (cached) {
          const cacheData = JSON.parse(cached);
          const age = Date.now() - cacheData.timestamp;
          
          if (age > CACHE_EXPIRY_MS) {
            localStorage.removeItem(key);
            cleaned++;
          }
        }
      }
    });
    
    if (cleaned > 0) {
      console.log(`[REQ-15] Cleaned ${cleaned} expired cache entries`);
    }
  } catch (err) {
    console.error('[REQ-15] Failed to clean expired cache:', err);
  }
}
