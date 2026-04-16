# REQ-1 and REQ-15 Implementation Summary

## REQ-1: Role-Based Access Control (RBAC)

**Requirement:** The system shall support distinct roles: Patient, Staff, and Administrator.

### Implementation Status: ✅ Complete

### Server-Side Implementation

#### 1. Database Schema
- **File:** `server/src/db/migrations/001_create_users.sql`
- **Implementation:** Users table with `role` enum field supporting 'patient', 'staff', 'admin'

#### 2. Authentication & Authorization
- **File:** `server/src/routes/auth.js`
  - Registration validates role is one of: patient, staff, admin
  - Login returns user role in JWT token
  - JWT tokens include userId and role claims

#### 3. Role-Based Middleware
- **File:** `server/src/middleware/requireRole.js`
  - Middleware function that accepts array of allowed roles
  - Validates JWT token and checks if user's role is authorized
  - Returns 403 Forbidden if role not allowed
  - Usage: `router.get('/admin/reports', requireRole(['admin']), handler)`

#### 4. Session Management
- **File:** `server/src/db/redis.js`
  - Redis-based token blacklist for logout
  - Session invalidation on logout

### Client-Side Implementation

#### 1. Protected Routes
- **File:** `client/src/components/common/ProtectedRoute.jsx`
  - Component that wraps routes requiring authentication
  - Checks if user is authenticated and has required role
  - Redirects to login if not authenticated
  - Shows "Access Denied" if wrong role

#### 2. Role-Based Layouts
- **File:** `client/src/components/layout/AdminShell.jsx`
  - Admin-specific layout wrapper
  - Only accessible to admin role

- **File:** `client/src/components/layout/Sidebar.jsx`
  - Navigation menu that shows different options based on role
  - Admin sees: Dashboard, Reports, Schedule Config, Users
  - Staff sees: Queue Dashboard, Broadcast Alerts
  - Patient sees: My Appointments, Book Appointment, Doctors

- **File:** `client/src/components/layout/TopBar.jsx`
  - Displays user name and role
  - Role-specific UI elements

#### 3. Authentication Service
- **File:** `client/src/services/auth.js`
  - Stores role in localStorage after login/register
  - Provides `getRole()` function for role checks
  - Clears role on logout

### Test Credentials

**Admin:**
- Email: `admin@demo.com`
- Password: `admin123`

**Staff (Doctors):**
- Email: `aryan@demo.com`, `priya@demo.com`, `rohan@demo.com`
- Password: (needs to be set via seed script)

**Patients:**
- Email: `patient1@demo.com` through `patient10@demo.com`
- Password: `password123`

---

## REQ-15: Local Schedule Cache

**Requirement:** The system shall cache the daily schedule locally to ensure readability during slow internet connectivity.

### Implementation Status: ✅ Complete

### Implementation Details

#### 1. Schedule Cache Service
- **File:** `client/src/services/scheduleCache.js`
- **Features:**
  - Caches schedule data in localStorage with 24-hour expiry
  - Cache key format: `saqms_schedule_{doctorId}_{date}`
  - Stores: slots, timestamp, doctorId, date
  - Automatic expiry checking
  - Cache cleanup utilities

#### 2. Cache Functions

**`cacheSchedule(doctorId, date, slots)`**
- Stores schedule data with timestamp
- Logs cache operations for debugging

**`getCachedSchedule(doctorId, date)`**
- Retrieves cached schedule if available
- Checks expiry (24 hours)
- Returns null if expired or not found
- Automatically removes expired entries

**`clearScheduleCache()`**
- Clears all cached schedules
- Useful for logout or data refresh

**`cleanExpiredCache()`**
- Removes only expired cache entries
- Called on app startup

#### 3. Integration Points

**BookAppointment Page**
- **File:** `client/src/pages/BookAppointment.jsx`
- **Flow:**
  1. Check cache first when date/doctor changes
  2. If cache hit: use cached data immediately
  3. If cache miss: fetch from API
  4. Store fetched data in cache for future use
  5. On error: fall back to cached data if available

**App Initialization**
- **File:** `client/src/main.jsx`
- Runs `cleanExpiredCache()` on app startup
- Keeps localStorage clean and performant

### Benefits

1. **Offline Capability:** Users can view previously loaded schedules even without internet
2. **Performance:** Instant schedule display from cache (no API wait time)
3. **Reduced Server Load:** Fewer API calls for frequently accessed schedules
4. **Better UX:** No loading spinners for cached data
5. **Automatic Cleanup:** Expired entries removed automatically

### Cache Behavior

- **Cache Duration:** 24 hours
- **Storage:** Browser localStorage (persistent across sessions)
- **Scope:** Per doctor per date
- **Expiry:** Automatic on next access attempt
- **Cleanup:** On app startup and on-demand

### Testing REQ-15

1. Book an appointment (loads schedule from API)
2. Refresh page and book again with same doctor/date
3. Check console: should see "[REQ-15] Using cached schedule"
4. Disconnect internet
5. Try to view same schedule: should still work from cache
6. Wait 24+ hours: cache should expire and require fresh fetch

---

## Compliance Summary

| Requirement | Status | Files Modified/Created |
|-------------|--------|------------------------|
| REQ-1 | ✅ Complete | 10+ files (auth, middleware, routes, components) |
| REQ-15 | ✅ Complete | 3 files (scheduleCache.js, BookAppointment.jsx, main.jsx) |

Both requirements are fully implemented and tested.
