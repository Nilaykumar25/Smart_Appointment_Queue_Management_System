// DATABASE FIRST - Cache functions deprecated
// All schedule data now fetched directly from database

// Placeholder functions for backward compatibility - no console warnings
export function cacheSchedule(doctorId, date, slots) {
  // No-op - database is primary source
}

export function getCachedSchedule(doctorId, date) {
  // Always return null - database is primary source
  return null;
}

export function clearScheduleCache() {
  // No-op - no cache to clear
}

export function cleanExpiredCache() {
  // No-op - no cache to clean
}
