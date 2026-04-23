// Utility functions for user-specific localStorage management

import { getUserId } from '../services/auth';

/**
 * Get user-specific localStorage key
 * @param {string} baseKey - Base key name (e.g., 'userAppointments')
 * @returns {string} - User-specific key (e.g., 'userAppointments_user123')
 */
export function getUserSpecificKey(baseKey) {
  const userId = getUserId();
  return userId ? `${baseKey}_${userId}` : baseKey;
}

/**
 * Get user-specific appointments from localStorage
 * @returns {Array} - Array of user's appointments
 */
export function getUserAppointments() {
  try {
    const key = getUserSpecificKey('userAppointments');
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Error loading user appointments:', error);
    return [];
  }
}

/**
 * Save user-specific appointments to localStorage
 * @param {Array} appointments - Array of appointments to save
 */
export function saveUserAppointments(appointments) {
  try {
    const key = getUserSpecificKey('userAppointments');
    localStorage.setItem(key, JSON.stringify(appointments));
  } catch (error) {
    console.error('Error saving user appointments:', error);
  }
}

/**
 * Clear all user-specific data (useful for logout)
 * @param {string} userId - User ID to clear data for
 */
export function clearUserData(userId) {
  if (!userId) return;
  
  const keysToRemove = [
    `userAppointments_${userId}`,
    // Add other user-specific keys here as needed
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
}

/**
 * Clear legacy data that might cause cross-user contamination
 */
export function clearLegacyData() {
  const legacyKeys = [
    'userAppointments', // Old non-user-specific key
  ];
  
  legacyKeys.forEach(key => {
    localStorage.removeItem(key);
  });
}