// IST Date Utilities
// Re-exports from timezone.js for backward compatibility
// All new code should import from timezone.js directly

export {
  getTodayIST,
  getTomorrowIST,
  getDateIST,
  getCurrentTimeIST,
  isToday,
  isTomorrow,
  formatToIST,
  getCurrentIST,
  dateToIST,
  formatTimeIST,
  formatDateIST
} from './timezone.js';