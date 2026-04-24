// Client-side timezone utility functions for consistent IST handling
// All timezone operations should use these standardized functions

/**
 * IST offset in milliseconds (UTC+5:30)
 */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * Get current date in IST as YYYY-MM-DD format
 * @returns {string} Today's date in IST (e.g., "2026-04-24")
 */
export function getTodayIST() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istTime = new Date(utc + IST_OFFSET_MS);
  
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
  const istTime = new Date(utc + IST_OFFSET_MS);
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
  const istTime = new Date(utc + IST_OFFSET_MS);
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
  return new Date(utc + IST_OFFSET_MS);
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

/**
 * Convert UTC timestamp to IST and format for display
 * @param {string|Date} utcTimestamp - UTC timestamp string or Date object
 * @returns {string} - Formatted IST time (e.g., "2024-04-17 16:37")
 */
export function formatToIST(utcTimestamp) {
  if (!utcTimestamp) return '';
  
  try {
    let date;
    if (typeof utcTimestamp === 'string') {
      // Handle string timestamps - ensure they're treated as UTC
      date = new Date(utcTimestamp.includes('UTC') ? utcTimestamp : utcTimestamp + ' UTC');
    } else {
      date = new Date(utcTimestamp);
    }
    
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const istTime = new Date(utc + IST_OFFSET_MS);
    
    const year = istTime.getFullYear();
    const month = String(istTime.getMonth() + 1).padStart(2, '0');
    const day = String(istTime.getDate()).padStart(2, '0');
    const hours = String(istTime.getHours()).padStart(2, '0');
    const minutes = String(istTime.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting timestamp to IST:', error);
    return utcTimestamp.toString(); // Return original if conversion fails
  }
}

/**
 * Get current IST time as a formatted string
 * @returns {string} - Current IST time (e.g., "2024-04-17 16:37")
 */
export function getCurrentIST() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istTime = new Date(utc + IST_OFFSET_MS);
  
  const year = istTime.getFullYear();
  const month = String(istTime.getMonth() + 1).padStart(2, '0');
  const day = String(istTime.getDate()).padStart(2, '0');
  const hours = String(istTime.getHours()).padStart(2, '0');
  const minutes = String(istTime.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * Convert local time to IST for display
 * @param {Date} date - JavaScript Date object
 * @returns {string} - Formatted IST time
 */
export function dateToIST(date) {
  if (!date) return '';
  
  return formatToIST(date);
}

/**
 * Format time for display (HH:MM format)
 * @param {string|Date} timestamp - Timestamp to format
 * @returns {string} - Time in HH:MM format
 */
export function formatTimeIST(timestamp) {
  const fullFormat = formatToIST(timestamp);
  return fullFormat.split(' ')[1] || '';
}

/**
 * Format date for display (YYYY-MM-DD format)
 * @param {string|Date} timestamp - Timestamp to format
 * @returns {string} - Date in YYYY-MM-DD format
 */
export function formatDateIST(timestamp) {
  const fullFormat = formatToIST(timestamp);
  return fullFormat.split(' ')[0] || '';
}