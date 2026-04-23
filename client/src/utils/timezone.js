// Timezone utility functions for consistent IST handling

/**
 * Convert UTC timestamp to IST and format for display
 * @param {string} utcTimestamp - UTC timestamp string (e.g., "2024-04-17 11:07")
 * @returns {string} - Formatted IST time (e.g., "2024-04-17 16:37")
 */
export function formatToIST(utcTimestamp) {
  if (!utcTimestamp) return '';
  
  try {
    // Parse the UTC timestamp and convert to IST
    const utcDate = new Date(utcTimestamp + ' UTC');
    
    // Format in IST timezone
    return utcDate.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.error('Error formatting timestamp to IST:', error);
    return utcTimestamp; // Return original if conversion fails
  }
}

/**
 * Get current IST time as a formatted string
 * @returns {string} - Current IST time (e.g., "2024-04-17 16:37")
 */
export function getCurrentIST() {
  return new Date().toLocaleString('en-IN', {
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
 * Convert local time to IST for display
 * @param {Date} date - JavaScript Date object
 * @returns {string} - Formatted IST time
 */
export function dateToIST(date) {
  if (!date) return '';
  
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}