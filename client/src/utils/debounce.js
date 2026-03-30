/**
 * ========================================
 * DEBOUNCE UTILITY FUNCTION
 * ========================================
 * REQ-14: Dashboard polling fix - debounce real-time queue refresh
 * 
 * Purpose: Prevents excessive function calls by delaying execution
 * and resetting the timer each time the function is called.
 * This is essential for reducing API calls and improving performance
 * when polling for real-time updates.
 */

/**
 * REQ-14: Debounce Function
 * 
 * Creates a debounced version of a function that will only be called
 * after the specified delay has elapsed since the last invocation.
 * Useful for limiting API calls during rapid consecutive updates.
 * 
 * @param {Function} func - The function to debounce
 * @param {number} delay - Delay in milliseconds before executing the function
 * @returns {Function} - Debounced version of the function
 * 
 * Example usage:
 *   const debouncedRefresh = debounce(() => loadQueueData(), 2000);
 *   debouncedRefresh(); // Will execute after 2 seconds
 *   debouncedRefresh(); // Resets timer, won't execute first call
 */
export const debounce = (func, delay) => {
  let timeoutId;
  
  return function (...args) {
    // Clear the existing timeout before setting a new one
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // REQ-14: Set new timeout to execute the function after the delay
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

export default debounce;
