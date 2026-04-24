// Server-side timezone utility functions for consistent IST handling
// All timezone operations should use these standardized functions

/**
 * IST offset in milliseconds (UTC+5:30)
 */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * Get current date in IST as YYYY-MM-DD format
 * @returns {string} Today's date in IST (e.g., "2026-04-24")
 */
function getTodayIST() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istTime = new Date(utc + IST_OFFSET_MS);
  
  const year = istTime.getFullYear();
  const month = String(istTime.getMonth() + 1).padStart(2, '0');
  const day = String(istTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Get current IST timestamp for database insertion
 * @returns {string} - Current IST timestamp in ISO format
 */
function getCurrentIST() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istTime = new Date(utc + IST_OFFSET_MS);
  
  return istTime.toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * Convert UTC timestamp to IST for display
 * @param {Date|string} utcDate - UTC Date object or timestamp string
 * @returns {string} - Formatted IST timestamp (YYYY-MM-DD HH:MM)
 */
function formatToIST(utcDate) {
  if (!utcDate) return '';
  
  try {
    let date;
    if (typeof utcDate === 'string') {
      // Handle string timestamps
      date = new Date(utcDate.includes('UTC') ? utcDate : utcDate + ' UTC');
    } else {
      date = new Date(utcDate);
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
    return utcDate.toString();
  }
}

/**
 * SQL fragment to convert UTC timestamp to IST
 * Use this in SELECT queries for timestamp fields
 * @param {string} columnName - Name of the timestamp column
 * @returns {string} - SQL fragment for timezone conversion
 */
function toISTSQL(columnName) {
  return `(${columnName} + INTERVAL '5 hours 30 minutes')`;
}

/**
 * SQL fragment to format timestamp as IST string
 * @param {string} columnName - Name of the timestamp column
 * @returns {string} - SQL fragment for IST formatting
 */
function formatISTSQL(columnName) {
  // Convert UTC timestamp to IST and format consistently
  return `TO_CHAR(${columnName} + INTERVAL '5 hours 30 minutes', 'YYYY-MM-DD HH24:MI')`;
}

/**
 * Get current IST time as Date object
 * @returns {Date} Current time in IST
 */
function getCurrentTimeIST() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + IST_OFFSET_MS);
}

/**
 * Convert date string to IST date (for day-of-week calculations)
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {Date} Date object in IST
 */
function dateStringToIST(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  return new Date(utc + IST_OFFSET_MS);
}

module.exports = {
  getTodayIST,
  getCurrentIST,
  formatToIST,
  toISTSQL,
  formatISTSQL,
  getCurrentTimeIST,
  dateStringToIST,
  IST_OFFSET_MS
};