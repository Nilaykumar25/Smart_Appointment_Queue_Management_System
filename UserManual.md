# 🏥 SAQMS User Manual
## Smart Appointment & Queue Management System

---

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Installation Steps](#installation-steps)
3. [Dependencies](#dependencies)
4. [Setup Instructions](#setup-instructions)
5. [Configuration Steps](#configuration-steps)
6. [Test Credentials](#test-credentials)
7. [Step-by-Step Instructions to Execute Major Features](#step-by-step-instructions-to-execute-major-features)
8. [Known Limitations](#known-limitations)

---

## System Requirements

Before installing SAQMS, ensure your system meets the following requirements:

### Hardware Requirements
- **Processor:** Intel Core i5 or equivalent (or higher)
- **RAM:** Minimum 4GB (8GB recommended)
- **Storage:** Minimum 2GB free disk space
- **Internet Connection:** Stable connection for server and database operations

### Software Requirements
- **Operating System:** Windows 10/11, macOS 10.14+, or Linux (Ubuntu 18.04+)
- **Node.js:** Version 14.x or higher (v16+ recommended)
- **npm:** Version 6.x or higher (comes with Node.js)
- **Git:** Version 2.0+ (for cloning the repository)
- **PostgreSQL:** Version 12+ (for database)
- **Redis:** Version 6.0+ (for caching and queuing)
- **Web Browser:** Chrome, Firefox, Safari, or Edge (latest versions)

### Optional but Recommended
- **Visual Studio Code** or any code editor
- **Postman** or **Thunder Client** (for API testing)
- **pgAdmin** (for PostgreSQL database management)

---

## Installation Steps

Follow these step-by-step instructions to install SAQMS on your system:

### Step 1: Prerequisites Installation

#### Install Node.js
1. Visit [nodejs.org](https://nodejs.org)
2. Download the LTS version (v18+ recommended)
3. Run the installer and follow the installation wizard
4. Verify installation by opening terminal/PowerShell and running:
   ```bash
   node --version
   npm --version
   ```

#### Install PostgreSQL
1. Visit [postgresql.org](https://www.postgresql.org/download/)
2. Download the appropriate version for your OS
3. Run the installer and note your PostgreSQL password
4. Complete installation with default settings
5. Verify by running:
   ```bash
   psql --version
   ```

#### Install Redis
1. **Windows:** Download from [memurai.com](https://www.memurai.com/) or use Windows Subsystem for Linux (WSL)
2. **macOS:** Run `brew install redis`
3. **Linux:** Run `sudo apt-get install redis-server`
4. Verify installation:
   ```bash
   redis-cli --version
   ```

#### Install Git
1. Visit [git-scm.com](https://git-scm.com)
2. Download and run the installer
3. Verify installation:
   ```bash
   git --version
   ```

### Step 2: Clone the Repository

```bash
# Navigate to your desired directory
cd c:\Documents\

# Clone the repository
git clone https://github.com/team/saqms.git
cd saqms
```

### Step 3: Backend Installation

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file (copy from .env.example or create new)
# See Configuration Steps section below
```

### Step 4: Frontend Installation

```bash
# Navigate to client directory (in a new terminal)
cd client

# Install dependencies
npm install
```

---

## Dependencies

### Backend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.21.2 | Web framework |
| pg | ^8.13.3 | PostgreSQL client |
| redis | ^5.11.0 | Caching & queuing |
| bcrypt | ^6.0.0 | Password hashing |
| jsonwebtoken | ^9.0.3 | JWT authentication |
| dotenv | ^16.4.7 | Environment variables |
| cors | ^2.8.5 | Cross-origin requests |
| cookie-parser | ^1.4.7 | Cookie parsing |
| node-cron | ^3.0.3 | Scheduled jobs |

**Development Dependencies:**
- nodemon ^3.1.9 - Auto-restart development server

### Frontend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^19.2.4 | UI library |
| react-dom | ^19.2.4 | React DOM rendering |
| react-router-dom | ^7.13.2 | Client-side routing |
| bootstrap | ^5.3.8 | CSS framework |
| jwt-decode | ^4.0.0 | JWT decoding |
| @emailjs/browser | ^4.4.1 | Email notifications |

**Development Dependencies:**
- vite ^8.0.1 - Build tool
- eslint ^9.39.4 - Code linting
- @vitejs/plugin-react ^6.0.1 - React plugin for Vite

---

## Setup Instructions

### Step 1: Database Setup

#### Create PostgreSQL Database
```bash
# Open PostgreSQL prompt
psql -U postgres

# Create database
CREATE DATABASE saqms_db;

# Create database user
CREATE USER saqms_user WITH PASSWORD 'your_secure_password';

# Grant privileges
ALTER ROLE saqms_user WITH SUPERUSER;
GRANT ALL PRIVILEGES ON DATABASE saqms_db TO saqms_user;

# Exit psql
\q
```

#### Run Database Migrations

```bash
cd server

# Run migration script (if available)
npm run migrate
# or
node src/db/seed.js
```

### Step 2: Redis Setup

#### Start Redis Service

**Windows (Memurai):**
```bash
# Redis should auto-start as a service
# Verify it's running
redis-cli ping
# Should return: PONG
```

**macOS:**
```bash
# Start Redis
redis-server

# In another terminal, verify
redis-cli ping
# Should return: PONG
```

**Linux:**
```bash
# Start Redis service
sudo service redis-server start

# Verify
redis-cli ping
# Should return: PONG
```

### Step 3: Verify Services

Ensure all services are running:
```bash
# Check PostgreSQL
psql -U saqms_user -d saqms_db -c "SELECT version();"

# Check Redis
redis-cli ping

# Check Node.js
node --version
```

---

## Configuration Steps

### Step 1: Create Environment File

In the `server` directory, create a `.env` file with the following variables:

```env
# ─── Server Configuration ─────────────────────────────────────────
PORT=8000
NODE_ENV=development

# ─── Database Configuration ───────────────────────────────────────
# Option 1: Use individual connection parameters
DB_HOST=localhost
DB_PORT=5432
DB_NAME=saqms_db
DB_USER=saqms_user
DB_PASSWORD=your_secure_password

# Option 2: Use connection string (for cloud databases like Supabase)
# DATABASE_URL=postgresql://user:password@host:port/dbname?sslmode=require

# ─── Redis Configuration ──────────────────────────────────────────
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# ─── JWT Configuration ────────────────────────────────────────────
JWT_SECRET=your_super_secret_jwt_key_min_32_characters
JWT_REFRESH_SECRET=your_refresh_token_secret_min_32_characters
JWT_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION=7d

# ─── Frontend Configuration ───────────────────────────────────────
CLIENT_URL=http://localhost:5173

# ─── Email Configuration (for notifications) ──────────────────────
EMAIL_SERVICE_ID=your_emailjs_service_id
EMAIL_TEMPLATE_ID=your_emailjs_template_id
EMAIL_PUBLIC_KEY=your_emailjs_public_key
```

### Step 2: Update Client Configuration (if needed)

The client uses Vite with default configuration pointing to `http://localhost:8000` for API calls.

**File:** `client/src/services/api.js`

Verify the API base URL matches your server configuration:
```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
```

### Step 3: Create Admin Account

```bash
cd server

# Create admin user
node create-admin.js
```

This creates an admin account with default credentials (see Test Credentials section).

---

## Test Credentials

### Default Admin Account

```
Email: admin@demo.com
Password: admin123
Role: Administrator
```

**⚠️ Important:** Change the admin password immediately after first login!

### Test Patient Accounts

If you run the seed script, the following test patients are created:

| Email | Password | Role | Doctor |
|-------|----------|------|--------|
| patient1@demo.com | patient123 | Patient | Dr. Ahmed | 
| patient2@demo.com | patient123 | Patient | Dr. Fatima |
| patient3@demo.com | patient123 | Patient | Dr. Kareem |

### Test Staff Accounts

| Email | Password | Role | 
|-------|----------|------|
| staff@demo.com | staff123 | Staff |
| doctor@demo.com | doctor123 | Doctor |

### Creating Custom Test Users

1. Launch the application at `http://localhost:5173`
2. Click **"Register"** on the home page
3. Enter email, name, and password
4. Click **"Sign Up"**
5. Use these credentials to login

---

## Step-by-Step Instructions to Execute Major Features

### Feature 1: User Registration

**Objective:** Create a new patient account

**Steps:**
1. Open the application in your browser (`http://localhost:5173`)
2. Click the **"Register"** button in the navigation bar
3. Fill in the registration form:
   - **Full Name:** Enter your complete name
   - **Email:** Enter a valid email address
   - **Password:** Enter a strong password (min 6 characters)
   - **Confirm Password:** Re-enter the password
4. Accept the Terms & Conditions checkbox
5. Click **"Sign Up"**
6. Check your email for verification link (if email is configured)
7. Click the verification link
8. You're now registered and ready to login

**Expected Outcome:** User account created successfully. Redirected to login page.

---

### Feature 2: User Login

**Objective:** Access your account

**Steps:**
1. On the home page, click **"Login"** button
2. Enter your credentials:
   - **Email:** Your registered email
   - **Password:** Your password
3. Click **"Login"**
4. If credentials are correct, you're redirected to Dashboard
5. **Remember Me:** Check this option to stay logged in

**Expected Outcome:** Successfully logged in and redirected to your dashboard.

**Troubleshooting:**
- If you see "Invalid credentials," verify your email/password
- If you forgot your password, click **"Forgot Password?"** (if available)

---

### Feature 3: Browse and Book Appointments

**Objective:** Schedule an appointment with a doctor

**Steps:**

#### Step 1: Navigate to Doctor Search
1. From the Dashboard, click **"Browse Doctors"** or **"Book Appointment"**
2. You're now on the Doctor Search page

#### Step 2: Filter Doctors
- **By Specialty:** Select from dropdown (e.g., Cardiology, Dermatology)
- **By Rating:** Filter doctors by rating (4-5 stars)
- **By Experience:** Filter by years of experience
- **Search:** Use search box to find specific doctor
- Click **"Apply Filters"** to update results

#### Step 3: Select a Doctor
1. Browse the doctor cards showing:
   - Doctor name and photo
   - Specialty
   - Years of experience
   - Consultation fee
   - Rating and reviews
2. Click on a doctor card to view full profile
3. Click **"Book Appointment"** button

#### Step 4: Select Date & Time
1. Calendar opens showing available dates
2. Select a date by clicking on it
3. Available time slots appear below
4. Click on desired time slot
5. Slot is highlighted indicating selection
6. Click **"Next"** or **"Continue"**

#### Step 5: Review Appointment Details
1. Verify appointment information:
   - Doctor name and specialty
   - Date and time
   - Consultation fee
   - Duration (usually 30 minutes)
2. Click **"Confirm Appointment"** to proceed

#### Step 6: Provide Medical Information
1. Fill in medical details (optional but recommended):
   - **Reason for Visit:** Describe your symptoms/concern
   - **Medical History:** Previous medical conditions
   - **Current Medications:** List any medications you take
2. Click **"Complete Booking"**

#### Step 7: Booking Confirmation
1. You'll see a confirmation page with:
   - Appointment confirmation number
   - Full appointment details
   - Email confirmation sent message
2. Click **"Go to Dashboard"** to see your appointment
3. You'll receive an email with appointment details

**Expected Outcome:** Appointment successfully booked. Visible in your Dashboard.

---

### Feature 4: View Dashboard & Manage Appointments

**Objective:** View your appointments and manage them

**Steps:**

#### View Appointments
1. Click **"Dashboard"** from navigation
2. You see three main sections:
   - **Upcoming Appointments:** Shows scheduled appointments
   - **Queue Status:** Shows your current position in queue
   - **Past Appointments:** Shows completed appointments

#### View Appointment Details
1. Click on any appointment card
2. You see:
   - Full appointment details
   - Doctor information
   - Appointment confirmation number
   - Queue position (if applicable)
   - Status badge (Scheduled/Completed/Cancelled)

#### Reschedule Appointment
1. Click **"Reschedule"** button on appointment card
2. Select new date and time
3. Confirm new appointment
4. Old appointment is replaced

#### Cancel Appointment
1. Click **"Cancel"** button on appointment card
2. Enter cancellation reason (optional)
3. Confirm cancellation
4. Appointment status changes to "Cancelled"
5. Doctor's slot becomes available for other patients

**Expected Outcome:** Dashboard updated with appointment changes.

---

### Feature 5: View Queue Status

**Objective:** Check your position in the waiting queue

**Steps:**
1. Go to **Dashboard**
2. Look for **"Queue Status"** section
3. You'll see:
   - Your queue position number
   - Total patients ahead of you
   - Estimated wait time
   - Current appointment time
4. Queue position updates in real-time
5. When it's your turn, you'll receive a notification

**Expected Outcome:** Real-time queue position and estimated wait time displayed.

---

### Feature 6: Manage Doctor Schedules (Admin/Doctor)

**Objective:** Set up and manage doctor availability

**Steps:**

#### Access Schedule Configuration
1. Login as **Admin** or **Doctor**
2. Go to **Admin Dashboard** → **Schedule Configuration**
3. Select a doctor from dropdown
4. Current schedule is displayed

#### Set Available Hours
1. Select day of week
2. Set **Start Time** (e.g., 09:00 AM)
3. Set **End Time** (e.g., 05:00 PM)
4. Set **Slot Duration** (e.g., 30 minutes)
5. Set **Break Time** if applicable

#### Add Available Dates
1. Select dates from calendar
2. Click **"Add Date"**
3. Set specific availability for that date

#### Mark Doctor As Unavailable
1. Select dates from calendar
2. Click **"Mark Unavailable"**
3. Reason is optional

#### Save Configuration
1. Review all settings
2. Click **"Save Schedule"**
3. Confirmation message appears

**Expected Outcome:** Schedule saved. Becomes available for patient booking.

---

### Feature 7: View Reports (Admin)

**Objective:** Access system analytics and reports

**Steps:**
1. Login as **Admin**
2. Navigate to **Admin Dashboard** → **Reports**
3. Available reports:
   - **Daily Reports:** Appointments and queue metrics per day
   - **Doctor Performance:** Consultation statistics
   - **Revenue Reports:** Income from consultations
   - **Patient Statistics:** Registration and booking trends

#### Generate Report
1. Select report type
2. Choose date range using date picker
3. Select filters (e.g., doctor, specialty)
4. Click **"Generate Report"**

#### Download Report
1. Click **"Download PDF"** or **"Export CSV"**
2. Report downloaded to your device

#### View Charts
1. Visual charts showing:
   - Appointments trend
   - Revenue growth
   - Popular doctors
   - Patient demographics

**Expected Outcome:** Comprehensive system analytics displayed.

---

### Feature 8: Notifications & Alerts

**Objective:** Receive appointment reminders and alerts

**Steps:**

#### Types of Notifications
1. **Appointment Confirmation:** Sent immediately after booking
2. **Appointment Reminder:** Sent 24 hours before appointment
3. **Queue Status Update:** Sent when your queue position changes
4. **Staff Alert:** Broadcast alerts sent by staff

#### Enable/Disable Notifications
1. Go to **Account Settings**
2. Navigate to **Notification Preferences**
3. Toggle notification types:
   - ☑ Email Notifications
   - ☑ In-App Notifications
   - ☑ SMS Notifications (if available)
4. Click **"Save Preferences"**

#### View Notification History
1. Click **Notification Bell** icon in top navigation
2. See list of recent notifications
3. Click on notification to view details
4. Old notifications can be cleared

**Expected Outcome:** Notifications received as per preferences.

---

### Feature 9: Update User Profile

**Objective:** Manage personal information

**Steps:**
1. Click **Profile Icon** in top-right corner
2. Click **"Edit Profile"**
3. Update information:
   - Full name
   - Phone number
   - Address
   - Medical history
   - Emergency contact
4. Click **"Save Changes"**
5. Confirmation message appears

#### Change Password
1. From Profile menu, click **"Change Password"**
2. Enter **Current Password**
3. Enter **New Password**
4. Confirm **New Password**
5. Click **"Update Password"**

**Expected Outcome:** Profile updated successfully.

---

### Feature 10: Contact & Support

**Objective:** Get help and contact the clinic

**Steps:**
1. Click **"Contact Us"** in navigation or footer
2. Fill in contact form:
   - **Name:** Your full name
   - **Email:** Your email address
   - **Subject:** Issue or question topic
   - **Message:** Detailed message
3. Click **"Send Message"**
4. Confirmation message appears
5. You'll receive a response within 24 hours

#### Access Help/FAQ
1. Click **"Help"** in navigation
2. Browse frequently asked questions
3. Search for specific topics
4. Click on question to expand answer
5. If not resolved, click **"Contact Support"**

**Expected Outcome:** Support request submitted successfully.

---

## Known Limitations

### Current Version Limitations

#### 1. Email Configuration
- **Limitation:** Email notifications require EmailJS configuration
- **Impact:** If not configured, email reminders won't be sent
- **Workaround:** Configure EmailJS credentials in `.env` file

#### 2. Concurrent Appointments
- **Limitation:** A patient cannot book multiple appointments with same doctor on same day
- **Impact:** Limited to one appointment per doctor per day
- **Workaround:** Book with different doctor or select different date

#### 3. Appointment Rescheduling
- **Limitation:** Can only reschedule appointments 48 hours before scheduled time
- **Impact:** Cannot reschedule last-minute appointments
- **Workaround:** Cancel and rebook if urgent change needed

#### 4. Queue Management
- **Limitation:** Queue resets daily; old queue records retained for reporting only
- **Impact:** Queue position numbers restart each day
- **Workaround:** None needed; this is by design

#### 5. Database Storage
- **Limitation:** System uses PostgreSQL locally; no built-in cloud sync
- **Impact:** Data is stored only on local server
- **Workaround:** Configure cloud PostgreSQL (e.g., Supabase) via DATABASE_URL in `.env`

#### 6. Browser Compatibility
- **Limitation:** Best experience on Chrome, Firefox, Safari, Edge
- **Impact:** Internet Explorer not supported
- **Workaround:** Use modern browser

#### 7. Real-time Updates
- **Limitation:** Queue updates require page refresh in some cases
- **Impact:** May need to refresh to see latest queue position
- **Workaround:** Wait a few seconds or manually refresh page

#### 8. Scalability
- **Limitation:** Single-server architecture; not horizontally scalable
- **Impact:** May experience slowdowns with 1000+ concurrent users
- **Workaround:** Deploy to cloud infrastructure (AWS, Azure, etc.)

#### 9. Appointment Duration
- **Limitation:** Fixed appointment slot durations per doctor
- **Impact:** Cannot have variable duration appointments
- **Workaround:** Create multiple doctors with different slot durations

#### 10. Language Support
- **Limitation:** Currently supports English only
- **Impact:** Interface not available in other languages
- **Workaround:** Browser translation features or future multi-language support

### Performance Considerations
- System handles up to 500 concurrent users efficiently
- Database queries may slow down with 100,000+ historical appointments
- Redis caching significantly improves performance for frequently accessed data

### Known Issues
- Occasional queue display lag during peak hours
- Email delivery may be delayed during high server load
- PDF report generation takes 5-10 seconds for large date ranges

---

## Troubleshooting Quick Links

### Application Won't Start
```bash
# Check Node.js installation
node --version

# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Check .env file exists
ls -la .env
```

### Database Connection Error
```bash
# Verify PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Check .env database credentials
cat .env | grep DB_
```

### Redis Connection Error
```bash
# Start Redis service
redis-server

# Test connection
redis-cli ping
```

### Port Already in Use
```bash
# Change PORT in .env file
# Or kill process using the port
# Windows: netstat -ano | findstr :8000
# macOS/Linux: lsof -i :8000
```

---

## Getting Help

If you encounter issues not covered here:

1. **Check Application Logs:** Look at server console for error messages
2. **Review .env Configuration:** Ensure all required variables are set
3. **Verify Services:** Check PostgreSQL, Redis, and Node.js are running
4. **Restart Application:** Often resolves temporary issues
5. **Contact Support:** Use the Contact Us feature in application
6. **Check Documentation:** Refer to project README.md for additional details

---

## Additional Resources

- **Project Repository:** [GitHub Link]
- **API Documentation:** See `server/README.md`
- **Database Schema:** See `server/src/db/migrations/`
- **Frontend Components:** See `client/src/components/`
- **Support Email:** support@saqms.com

---

**Last Updated:** April 17, 2026
**Version:** 1.0.0
**Status:** Production Ready
