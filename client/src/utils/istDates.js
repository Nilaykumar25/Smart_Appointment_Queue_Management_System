// IST Date Utilities
// Provides consistent IST date handling across the application

/**
 * Get current date in IST as YYYY-MM-DD format
 * @returns {string} Today's date in IST (e.g., "2026-04-24")
 */
export function getTodayIST() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istOffset = 5.5 * 60 * 60000; // IST is UTC+5:30
  const istTime = new Date(utc + istOffset);
  
  const year = istTime.getFullYear();
  const month = String(istTime.getMonth() + 1).padStart(2, '0');
  const day = String(istTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Get tomorrow's date in IST as YYYY-MM-DD format
 * @returns {string} Tomorrow's date in IST (e.g., "2026-04-25")
 */
export function getTomorrowIST() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istOffset = 5.5 * 60 * 60000; // IST is UTC+5:30
  const istTime = new Date(utc + istOffset);
  istTime.setDate(istTime.getDate() + 1);
  
  const year = istTime.getFullYear();
  const month = String(istTime.getMonth() + 1).padStart(2, '0');
  const day = String(istTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Get a date N days from today in IST as YYYY-MM-DD format
 * @param {number} days - Number of days to add (can be negative)
 * @returns {string} Date in IST format
 */
export function getDateIST(days = 0) {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istOffset = 5.5 * 60 * 60000; // IST is UTC+5:30
  const istTime = new Date(utc + istOffset);
  istTime.setDate(istTime.getDate() + days);
  
  const year = istTime.getFullYear();
  const month = String(istTime.getMonth() + 1).padStart(2, '0');
  const day = String(istTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Get current time in IST
 * @returns {Date} Current time in IST
 */
export function getCurrentTimeIST() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istOffset = 5.5 * 60 * 60000; // IST is UTC+5:30
  return new Date(utc + istOffset);
}

/**
 * Check if a date string is today in IST
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {boolean} True if the date is today in IST
 */
export function isToday(dateStr) {
  return dateStr === getTodayIST();
}

/**
 * Check if a date string is tomorrow in IST
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {boolean} True if the date is tomorrow in IST
 */
export function isTomorrow(dateStr) {
  return dateStr === getTomorrowIST();
}