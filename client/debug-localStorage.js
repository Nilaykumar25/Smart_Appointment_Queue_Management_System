// Debug script to check localStorage state
// Run this in browser console to see current localStorage state

function debugLocalStorage() {
  console.log('=== localStorage Debug ===');
  
  // Show all localStorage keys
  console.log('All localStorage keys:');
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);
    console.log(`  ${key}:`, value);
  }
  
  // Show current user info
  const userId = localStorage.getItem('saqms_user_id');
  const userName = localStorage.getItem('saqms_name');
  console.log('\nCurrent user:');
  console.log(`  ID: ${userId}`);
  console.log(`  Name: ${userName}`);
  
  // Show appointment data
  console.log('\nAppointment data:');
  const legacyAppointments = localStorage.getItem('userAppointments');
  const userSpecificAppointments = localStorage.getItem(`userAppointments_${userId}`);
  
  console.log(`  Legacy (userAppointments):`, legacyAppointments);
  console.log(`  User-specific (userAppointments_${userId}):`, userSpecificAppointments);
  
  if (legacyAppointments) {
    console.warn('⚠️  Legacy appointment data found! This should be cleared.');
  }
  
  if (userSpecificAppointments) {
    const appointments = JSON.parse(userSpecificAppointments);
    console.log(`  User has ${appointments.length} appointments`);
  } else {
    console.log('  No user-specific appointments found');
  }
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  debugLocalStorage();
}

// Export for manual use
window.debugLocalStorage = debugLocalStorage;