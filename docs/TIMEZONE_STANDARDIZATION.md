# Timezone Standardization

## Overview

This document describes the standardized timezone handling implemented across the SAQMS platform to ensure consistent IST (Indian Standard Time) display and calculations.

## Problem Solved

Previously, the platform had inconsistent timezone handling:
- Frontend used both manual IST calculation and browser timezone
- Backend used mixed approaches: `AT TIME ZONE 'Asia/Kolkata'` and manual offset
- Notifications used different timezone conversion methods
- Date/time displays were inconsistent across components

## Solution

### Standardized Utilities

#### Server-side (`server/src/utils/timezone.js`)
- `getTodayIST()` - Get current date in IST as YYYY-MM-DD
- `getCurrentIST()` - Get current IST timestamp for database insertion
- `formatToIST(utcDate)` - Convert UTC timestamp to IST for display
- `formatISTSQL(columnName)` - SQL fragment for IST formatting
- `dateStringToIST(dateStr)` - Convert date string to IST Date object

#### Client-side (`client/src/utils/timezone.js`)
- `getTodayIST()` - Get current date in IST as YYYY-MM-DD
- `formatToIST(timestamp)` - Convert UTC timestamp to IST for display
- `getCurrentIST()` - Get current IST time as formatted string
- `formatTimeIST(timestamp)` - Format time only (HH:MM)
- `formatDateIST(timestamp)` - Format date only (YYYY-MM-DD)

### Key Changes

1. **Consistent IST Offset**: All utilities use `5.5 * 60 * 60 * 1000` milliseconds
2. **Manual Calculation**: Avoids browser timezone dependencies
3. **SQL Standardization**: Uses `+ INTERVAL '5 hours 30 minutes'` consistently
4. **Unified Date Handling**: All date operations use the same IST calculation method

### Updated Components

- **Queue Dashboard**: Uses standardized IST date functions
- **Notifications**: Consistent timestamp formatting
- **Appointments**: Standardized date comparisons
- **Slots**: Consistent day-of-week calculations
- **Schedule Management**: Unified timezone handling

### Benefits

- **Consistency**: All timestamps display in IST across the platform
- **Reliability**: No dependency on browser timezone settings
- **Maintainability**: Single source of truth for timezone calculations
- **Accuracy**: Eliminates timezone-related bugs and discrepancies

## Usage Guidelines

### For New Development

1. Always import timezone utilities from the standardized modules
2. Use `getTodayIST()` for current date comparisons
3. Use `formatToIST()` for displaying timestamps to users
4. Use `formatISTSQL()` in database queries for consistent formatting

### Database Queries

```sql
-- Good: Use standardized IST formatting
SELECT ${formatISTSQL('timestamp')} AS "sentAt" FROM notifications

-- Good: Use consistent date comparison
WHERE DATE(s.date) = $1  -- Pass getTodayIST() as parameter

-- Avoid: Mixed timezone approaches
WHERE DATE(s.date AT TIME ZONE 'Asia/Kolkata') = ...
```

### Frontend Display

```javascript
// Good: Use standardized formatting
import { formatToIST, getTodayIST } from '../utils/timezone';
const displayTime = formatToIST(utcTimestamp);
const today = getTodayIST();

// Avoid: Browser-dependent formatting
const displayTime = new Date(timestamp).toLocaleString();
```

## Migration Notes

- Existing `istDates.js` now re-exports from `timezone.js` for backward compatibility
- All timezone calculations now use the same IST offset constant
- Database queries updated to use consistent SQL fragments
- Frontend components updated to use standardized formatting functions

This standardization ensures that all users see consistent, accurate IST times regardless of their browser settings or server configuration.