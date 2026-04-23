// Server-side timezone utility functions for consistent IST handling

/**
 * Get current IST timestamp for database insertion
 * @returns {string} - Current IST timestamp in ISO format
 */
function getCurrentIST() {
  return new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' });
}

/**
 * Convert UTC timestamp to IST for display
 * @param {Date} utcDate - UTC Date object
 * @returns {string} - Formatted IST timestamp
 */
function formatToIST(utcDate) {
  if (!utcDate) return '';
  
  return utcDate.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * SQL fragment to convert UTC timestamp to IST
 * Use this in SELECT queries for timestamp fields
 * @param {string} columnName - Name of the timestamp column
 * @returns {string} - SQL fragment for timezone conversion
 */
function toISTSQL(columnName) {
  return `${columnName} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata'`;
}

/**
 * SQL fragment to format timestamp as IST string
 * @param {string} columnName - Name of the timestamp column
 * @returns {string} - SQL fragment for IST formatting
 */
function formatISTSQL(columnName) {
  // Convert UTC timestamp to IST and format
  return `TO_CHAR(${columnName} + INTERVAL '5 hours 30 minutes', 'YYYY-MM-DD HH24:MI')`;
}

module.exports = {
  getCurrentIST,
  formatToIST,
  toISTSQL,
  formatISTSQL
};