# SAQMS — Smart Appointment & Queue Management System

A web-based clinic appointment and queue management system built for DSC-11 Software Engineering. This application allows patients to easily book appointments with doctors, manage their schedules, and track their position in the waiting queue.

---

## 🚀 Getting Started

### For First-Time Users

#### **Step 1: Create an Account**
1. Click **"Register"** on the home page
2. Fill in your details:
   - Full Name
   - Email Address
   - Password (choose a strong password)
   - Confirm Password
3. Click **"Sign Up"** to create your account
4. You'll be redirected to the login page

#### **Step 2: Login to Your Account**
1. Click **"Login"** on the home page
2. Enter your email and password
3. Click **"Login"** to access your dashboard

---

## 📅 How to Book an Appointment

### **Step 1: Browse Doctors**
1. After logging in, click **"Browse Doctors"** or navigate to the Doctors section
2. View available doctors with their:
   - Specialization/Medical Field
   - Rating and Experience
   - Consultation Fee
3. Filter or search for doctors based on your needs

### **Step 2: Select Date & Time**
1. Click **"Book Appointment"** on your chosen doctor's card
2. **Select a Date:**
   - Choose from available appointment dates
   - Calendar with available dates will be displayed
3. **Select a Time Slot:**
   - View available time slots for the selected date
   - Search for specific times using the search bar
   - Click on your preferred time slot

### **Step 3: Review & Confirm**
1. You'll see an **Appointment Summary** showing:
   - Doctor name and specialty
   - Selected date and time
   - Consultation fee
2. Click **"Confirm Booking"** to proceed to confirmation

### **Step 4: Complete Patient Information**
1. Provide additional medical information:
   - **Reason for Visit** (required) - Describe your symptoms/concerns
   - **Medical History** (optional) - Previous conditions or surgeries
   - **Allergies** (optional) - Any known allergies
   - **Current Medications** (optional) - Medications you're taking
2. Review the **Terms & Conditions:**
   - **Cancellation Policy** - Details about cancellation windows
   - **Privacy Policy** - Your data protection information
   - **Appointment Terms** - What to expect during your visit
3. Check the agreement checkbox: "I have read and agree to the terms..."
4. Click **"✅ Confirm Booking"** to finalize your appointment

### **Step 5: Appointment Confirmed**
- You'll see a **Success Message** ✅
- You'll be automatically redirected to your **Dashboard** in 2 seconds
- Your appointment is now saved and ready!

---

## 📊 Your Dashboard

Once logged in, your dashboard shows:

### **Appointment Statistics**
- **📅 Upcoming Appointments** - Total number of scheduled appointments
- **✅ Completed** - Appointments you've successfully attended
- **⏱️ Queue Position** - Your current position in the waiting queue
- **💰 Amount Due** - Any pending payments

### **Upcoming Appointments**
View all your scheduled appointments with:
- Doctor name and specialty
- Appointment date and time
- Status (Confirmed, Pending, Completed, Cancelled)
- **Cancel Appointment** button if needed

### **Other Features**
- **Queue Status** - Real-time tracking of your position in clinic queue
- **Medical Records** - Access your consultation summaries and prescriptions
- **Notifications** - Important updates about appointments and queue changes

---

## 🔧 Features & Capabilities

### **For Patients**
✅ Easy registration and secure login
✅ Browse doctors by specialty, rating, and experience
✅ View real-time appointment availability
✅ Book appointments with comprehensive information
✅ Review and manage all your appointments
✅ Cancel appointments with proper policies
✅ Track your position in the waiting queue
✅ Access medical records and consultation history
✅ Receive appointment reminders and notifications

### **Appointment Workflow**
1. **Doctor Search** → Find the right doctor
2. **Slot Selection** → Choose date & time
3. **Booking Confirmation** → Verify all details
4. **Patient Information** → Provide medical context
5. **Final Confirmation** → Save appointment
6. **Dashboard View** → Manage your appointments

---

## 💡 Important Information

### **Cancellation Policy**
- **Free Cancellation:** Up to 24 hours before appointment
- **Partial Refund:** 50% refund if cancelled 12-24 hours before
- **No Refund:** Less than 12 hours cancellation
- **Full Charge:** No-show without cancellation

### **Appointment Reminders**
- Email reminders sent 24 hours before appointment
- SMS notifications for important updates
- Check your dashboard regularly for updates

### **Preparing for Your Appointment**
- Arrive 10 minutes early at the clinic
- Bring valid ID and insurance information if applicable
- Have your medical history ready if it's your first visit
- Prepare a list of current medications you're taking
- Note down any allergies or drug sensitivities

---

## 🆘 Need Help?

### **Common Questions**
**Q: How do I reset my password?**
A: Click "Forgot Password" on the login page and follow the email instructions.

**Q: Can I reschedule my appointment?**
A: Yes, you can cancel your current appointment and book a new one.

**Q: What if I need to cancel my appointment?**
A: Use the "Cancel Appointment" button on your dashboard. Refer to our cancellation policy for refund information.

**Q: Is my personal information secure?**
A: Yes, we follow HIPAA and data protection regulations. Your information is encrypted and never shared without consent.

**Q: How can I contact a doctor outside of appointments?**
A: Use the messaging feature in your dashboard (if available in your clinic).

### **Contact Us**
- Email: support@saqms.com
- Phone: +1-XXX-XXX-XXXX
- Help Center: [Link to help page]

---

## Tech Stack

- **Frontend:** React + Vite
- **Backend:** Node.js / Express
- **Database:** PostgreSQL
- **Authentication:** JWT + bcrypt
- **Notifications:** SendGrid (email), Twilio (SMS)
- **Styling:** CSS with modern design patterns

---

## Prerequisites (Developer Setup)

- Node.js v18+
- PostgreSQL 14+
- Redis (for caching)
- npm or yarn

---

## Installation Guide (For Developers)

_Refer to setup-specific documentation in the `/docs` folder for detailed installation and deployment instructions._

## Team

- Riddhima Chaturvedi
- Shambhavi Goel
- Nilay Kumar
- Shubh Mittal
- Amitansh Kesharwani

---

## License

This project is developed as part of DSC-11 Software Engineering course.
