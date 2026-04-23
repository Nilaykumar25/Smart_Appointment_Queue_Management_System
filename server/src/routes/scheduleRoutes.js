// Implements: REQ-9  — Define daily start/end times and slot duration
// Implements: REQ-10 — Blackout dates for holidays / doctor leave
// Implements: REQ-11 — Open / close specific slots for emergency blocks
// Implements: REQ-18 — Audit log every schedule change
// See SRS Section 4.4 — Clinic Schedule Management

const express        = require("express");
const router         = express.Router();
const db             = require("../db/connection");
const requireRole    = require("../middleware/requireRole");
const auditMiddleware = require("../middleware/auditMiddleware");

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/schedule/config
// Returns all doctors + their schedules + all blackout dates
// Called by: ScheduleConfigUI.jsx on page load
// ─────────────────────────────────────────────────────────────────────────────
router.get("/config", requireRole(["admin", "staff"]), async (req, res) => {
  try {
    // Fetch all doctors
    const { rows: doctors } = await db.query(
      `SELECT doctor_id AS "doctorId", name, specialty FROM doctors ORDER BY name`
    );

    // Fetch all non-blackout schedules (working day configs)
    // We group by doctor and aggregate working days
    const { rows: scheduleRows } = await db.query(
      `SELECT
         doctor_id      AS "doctorId",
         TO_CHAR(date, 'Dy') AS day,
         TO_CHAR(start_time, 'HH24:MI') AS "startTime",
         TO_CHAR(end_time,   'HH24:MI') AS "endTime",
         slot_duration  AS "slotDuration"
       FROM schedules
       WHERE is_blackout = FALSE
       ORDER BY doctor_id, date`
    );

    // Build schedule config per doctor: pick most recent entry's times + collect days
    const scheduleMap = {};
    for (const row of scheduleRows) {
      if (!scheduleMap[row.doctorId]) {
        scheduleMap[row.doctorId] = {
          doctorId:     row.doctorId,
          workingDays:  [],
          startTime:    row.startTime,
          endTime:      row.endTime,
          slotDuration: row.slotDuration,
        };
      }
      // Avoid duplicate days
      if (!scheduleMap[row.doctorId].workingDays.includes(row.day)) {
        scheduleMap[row.doctorId].workingDays.push(row.day);
      }
    }

    // Fetch all blackout dates
    const { rows: blackoutRows } = await db.query(
      `SELECT DISTINCT
         TO_CHAR(date, 'YYYY-MM-DD') AS date,
         'Blackout' AS reason
       FROM schedules
       WHERE is_blackout = TRUE
       ORDER BY date`
    );

    res.json({
      doctors,
      schedules:     Object.values(scheduleMap),
      blackoutDates: blackoutRows,
    });
  } catch (err) {
    console.error("GET /schedule/config error:", err);
    res.status(500).json({ error: "Failed to fetch schedule config" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/schedule/config
// Save a doctor's working schedule (REQ-9)
// Body: { doctorId, workingDays: ['Mon','Tue',...], startTime, endTime, slotDuration }
// Called by: ScheduleConfigUI.jsx "Save Schedule" button
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  "/config",
  requireRole(["admin"]),
  auditMiddleware("SCHEDULE"),
  async (req, res) => {
    const { doctorId, workingDays, startTime, endTime, slotDuration } = req.body;

    console.log('[POST /schedule/config] Received request:', { 
      doctorId, 
      workingDays, 
      startTime, 
      endTime, 
      slotDuration,
      slotDurationType: typeof slotDuration
    });

    // Validate required fields
    if (!doctorId || !workingDays?.length || !startTime || !endTime || !slotDuration) {
      console.error('[POST /schedule/config] Validation failed: Missing required fields');
      return res.status(400).json({
        error: "doctorId, workingDays, startTime, endTime, slotDuration are all required",
      });
    }
    if (startTime >= endTime) {
      console.error('[POST /schedule/config] Validation failed: startTime >= endTime');
      return res.status(400).json({ error: "startTime must be before endTime" });
    }

    const validDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    if (!workingDays.every(d => validDays.includes(d))) {
      console.error('[POST /schedule/config] Validation failed: Invalid working days');
      return res.status(400).json({ error: "workingDays must contain valid day names: Mon Tue Wed Thu Fri Sat Sun" });
    }

    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
      console.error('[POST /schedule/config] Validation failed: Invalid time format');
      return res.status(400).json({ error: "startTime and endTime must be in HH:MM format" });
    }

    try {
      // Map day abbreviations to the next occurrence of that weekday
      // We generate entries for the next 90 days for the selected working days
      const dayMap = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };
      const today  = new Date();
      const datesToInsert = [];

      for (let i = 0; i < 90; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dayName = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getDay()];
        if (workingDays.includes(dayName)) {
          datesToInsert.push(d.toISOString().split("T")[0]);
        }
      }

      console.log(`[POST /schedule/config] Generated ${datesToInsert.length} dates to insert`);

      // Strategy for handling existing schedules with appointments:
      // 1. Delete schedules WITHOUT appointments (safe to remove)
      // 2. For schedules WITH appointments, we keep them as-is to preserve foreign keys
      // 3. Insert new schedules for dates that don't exist yet
      
      // Step 1: Delete only schedules without appointments for this doctor in the date range
      const deleteResult = await db.query(
        `DELETE FROM schedules
         WHERE doctor_id = $1
           AND is_blackout = FALSE
           AND date >= CURRENT_DATE
           AND date < CURRENT_DATE + INTERVAL '90 days'
           AND schedule_id NOT IN (
             SELECT DISTINCT schedule_id 
             FROM appointments 
             WHERE schedule_id IS NOT NULL
           )`,
        [doctorId]
      );
      
      console.log(`[POST /schedule/config] Deleted ${deleteResult.rowCount} schedules without appointments`);

      // Step 2: Get all existing schedule dates for this doctor (including those with appointments)
      const { rows: existingSchedules } = await db.query(
        `SELECT DISTINCT date::text as date
         FROM schedules
         WHERE doctor_id = $1
           AND date >= CURRENT_DATE
           AND date < CURRENT_DATE + INTERVAL '90 days'
           AND is_blackout = FALSE`,
        [doctorId]
      );
      
      const existingDates = new Set(existingSchedules.map(s => s.date));
      console.log(`[POST /schedule/config] Found ${existingDates.size} existing schedule dates`);

      // Step 3: Insert new schedules only for dates that don't exist yet
      let insertedCount = 0;
      for (const date of datesToInsert) {
        if (!existingDates.has(date)) {
          await db.query(
            `INSERT INTO schedules (doctor_id, date, start_time, end_time, slot_duration, is_blackout)
             VALUES ($1, $2, $3, $4, $5, FALSE)`,
            [doctorId, date, startTime, endTime, slotDuration]
          );
          insertedCount++;
        }
      }
      
      console.log(`[POST /schedule/config] Inserted ${insertedCount} new schedules`);

      console.log('[POST /schedule/config] Schedule saved successfully');
      res.status(201).json({
        message:       "Schedule saved successfully",
        datesScheduled: insertedCount,
      });
    } catch (err) {
      console.error("[POST /schedule/config] Database error:", err);
      res.status(500).json({ error: `Failed to save schedule: ${err.message}` });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/schedule/blackout
// Add a blackout date — marks doctor(s) unavailable (REQ-10)
// Body: { date: 'YYYY-MM-DD', reason: 'Holiday name' }
// Called by: ScheduleConfigUI.jsx "Add Blackout Date" button
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  "/blackout",
  requireRole(["admin"]),
  auditMiddleware("BLACKOUT"),
  async (req, res) => {
    const { date, reason } = req.body;

    if (!date) {
      return res.status(400).json({ error: "date is required (YYYY-MM-DD)" });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: "date must be in YYYY-MM-DD format" });
    }

    try {
      // Get all doctors so we can block the day for all of them
      const { rows: doctors } = await db.query(
        `SELECT doctor_id FROM doctors`
      );

      if (doctors.length === 0) {
        return res.status(400).json({ error: "No doctors found in the system" });
      }

      // For each doctor, upsert a blackout row for that date
      for (const doctor of doctors) {
        // Remove any existing open schedule for that date first
        await db.query(
          `DELETE FROM schedules WHERE doctor_id = $1 AND date = $2`,
          [doctor.doctor_id, date]
        );

        // Insert blackout row
        await db.query(
          `INSERT INTO schedules (doctor_id, date, start_time, end_time, slot_duration, is_blackout)
           VALUES ($1, $2, '00:00', '00:00', 0, TRUE)
           ON CONFLICT DO NOTHING`,
          [doctor.doctor_id, date]
        );
      }

      res.status(201).json({
        message: `Blackout date ${date} added successfully`,
        reason:  reason || "No reason specified",
      });
    } catch (err) {
      console.error("POST /schedule/blackout error:", err);
      res.status(500).json({ error: "Failed to add blackout date" });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/schedule/blackout/:date
// Remove a blackout date — re-opens that day (REQ-10)
// Called by: ScheduleConfigUI.jsx "Remove" button on a blackout date
// ─────────────────────────────────────────────────────────────────────────────
router.delete(
  "/blackout/:date",
  requireRole(["admin"]),
  auditMiddleware("BLACKOUT"),
  async (req, res) => {
    const { date } = req.params;

    try {
      const { rowCount } = await db.query(
        `DELETE FROM schedules WHERE date = $1 AND is_blackout = TRUE`,
        [date]
      );

      if (rowCount === 0) {
        return res.status(404).json({ error: "No blackout found for that date" });
      }

      res.json({ message: `Blackout date ${date} removed successfully` });
    } catch (err) {
      console.error("DELETE /schedule/blackout/:date error:", err);
      res.status(500).json({ error: "Failed to remove blackout date" });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/schedule/slots/:scheduleId
// Open or close a specific slot for emergency blocks (REQ-11)
// Body: { action: 'open' | 'close' }
// Called by: staff when blocking a slot due to emergency
// ─────────────────────────────────────────────────────────────────────────────
router.patch(
  "/slots/:scheduleId",
  requireRole(["admin", "staff"]),
  auditMiddleware("SLOT"),
  async (req, res) => {
    const { scheduleId } = req.params;
    const { action } = req.body;  // 'open' or 'close'

    if (!["open", "close"].includes(action)) {
      return res.status(400).json({ error: "action must be 'open' or 'close'" });
    }

    try {
      // We use is_blackout as the slot blocked flag
      const isBlackout = action === "close";

      const { rowCount } = await db.query(
        `UPDATE schedules SET is_blackout = $1 WHERE schedule_id = $2`,
        [isBlackout, scheduleId]
      );

      if (rowCount === 0) {
        return res.status(404).json({ error: "Schedule slot not found" });
      }

      res.json({
        message: `Slot ${action === "close" ? "closed (emergency block)" : "reopened"} successfully`,
      });
    } catch (err) {
      console.error("PATCH /schedule/slots/:id error:", err);
      res.status(500).json({ error: "Failed to update slot status" });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/schedule/doctor/:doctorId
// Get schedule for a specific doctor (original stub endpoint, now real)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/doctor/:doctorId", async (req, res) => {
  const { doctorId } = req.params;

  try {
    const { rows } = await db.query(
      `SELECT
         schedule_id    AS "scheduleId",
         doctor_id      AS "doctorId",
         TO_CHAR(date, 'YYYY-MM-DD')       AS date,
         TO_CHAR(start_time, 'HH24:MI')    AS "startTime",
         TO_CHAR(end_time,   'HH24:MI')    AS "endTime",
         slot_duration  AS "slotDuration",
         is_blackout    AS "isBlackout"
       FROM schedules
       WHERE doctor_id = $1
         AND date >= CURRENT_DATE
       ORDER BY date`,
      [doctorId]
    );

    res.json({ message: "Schedules fetched successfully", data: rows });
  } catch (err) {
    console.error("GET /schedule/doctor/:doctorId error:", err);
    res.status(500).json({ error: "Failed to fetch doctor schedule" });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════════════
// REQ-9: Facility Operating Hours Configuration
// ═══════════════════════════════════════════════════════════════════════════════════════
/**
 * Facility Hours Mapping Strategy:
 *   - Each day of week (0=Mon, 1=Tue, ..., 6=Sun) has its own row
 *   - Each row defines when the facility is open on that day
 *   - is_operational flag: TRUE = open, FALSE = closed/holiday
 *   - All doctor schedules must be nested within facility hours
 *   - Example: If facility is 08:00-18:00, doctors can't have slots outside those bounds
 *   - Admin configures facility hours via ScheduleConfigUI
 */

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/schedule/facility
// Returns facility operating hours for all 7 days of the week
// Called by: ScheduleConfigUI.jsx on page load
// Response: Array of 7 objects (Mon-Sun) with operating hours
// ─────────────────────────────────────────────────────────────────────────────
router.get("/facility", requireRole(["admin", "staff"]), async (req, res) => {
  try {
    // Fetch facility config for all 7 days
    // REQ-9: Facility Hours Mapping
    //   - day_of_week 0 = Monday, 1 = Tuesday, ..., 6 = Sunday
    //   - start_time = when facility opens
    //   - end_time = when facility closes
    //   - is_operational = TRUE if open, FALSE if closed
    const { rows } = await db.query(
      `SELECT
         config_id        AS "configId",
         day_of_week      AS "dayOfWeek",
         TO_CHAR(start_time, 'HH24:MI') AS "startTime",
         TO_CHAR(end_time,   'HH24:MI') AS "endTime",
         is_operational   AS "isOperational"
       FROM facility_config
       ORDER BY day_of_week ASC`
    );

    // Map day numbers to names for clarity
    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const facilityCfg = rows.map((row) => ({
      ...row,
      dayName: dayNames[row.dayOfWeek],
    }));

    res.json({
      message: "Facility config fetched successfully",
      facilityHours: facilityCfg,
    });
  } catch (err) {
    console.error("GET /schedule/facility error:", err);
    res.status(500).json({ error: "Failed to fetch facility config" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/schedule/facility/:dayOfWeek
// Update facility operating hours for a specific day
// Body: { startTime: 'HH:MM', endTime: 'HH:MM', isOperational: boolean }
// Called by: ScheduleConfigUI.jsx when admin configures facility hours
// ─────────────────────────────────────────────────────────────────────────────
router.patch(
  "/facility/:dayOfWeek",
  requireRole(["admin"]),
  auditMiddleware("FACILITY_CONFIG"),
  async (req, res) => {
    const { dayOfWeek } = req.params;
    const { startTime, endTime, isOperational } = req.body;

    console.log(`[PATCH /schedule/facility/${dayOfWeek}] Request received:`, {
      dayOfWeek,
      startTime,
      endTime,
      isOperational,
      bodyKeys: Object.keys(req.body)
    });

    // Validate day_of_week (0-6)
    const dayNum = parseInt(dayOfWeek);
    if (isNaN(dayNum) || dayNum < 0 || dayNum > 6) {
      console.error(`[PATCH /schedule/facility/${dayOfWeek}] Invalid day number: ${dayNum}`);
      return res.status(400).json({ error: "dayOfWeek must be 0-6 (Monday-Sunday)" });
    }

    // REQ-9: Facility Hours Validation
    //   - Both start and end times required when facility is operational
    //   - Start time must be before end time
    if (isOperational === true) {
      if (!startTime || !endTime) {
        console.error(`[PATCH /schedule/facility/${dayOfWeek}] Missing times for operational day`);
        return res.status(400).json({
          error: "startTime and endTime are required when facility is operational",
        });
      }
      if (startTime >= endTime) {
        console.error(`[PATCH /schedule/facility/${dayOfWeek}] Invalid time range: ${startTime} >= ${endTime}`);
        return res.status(400).json({
          error: "startTime must be before endTime",
        });
      }
    }

    try {
      console.log(`[PATCH /schedule/facility/${dayOfWeek}] Updating facility hours:`, {
        dayNum,
        startTime,
        endTime,
        isOperational
      });

      // REQ-9: Update facility hours mapping
      //   - Updates the specific day's operating hours
      //   - If isOperational=false, times are irrelevant but stored for reference
      const { rows } = await db.query(
        `UPDATE facility_config
         SET start_time     = $2,
             end_time       = $3,
             is_operational = $4,
             updated_at     = NOW()
         WHERE day_of_week = $1
         RETURNING *`,
        [dayNum, startTime || "00:00", endTime || "00:00", isOperational]
      );

      if (rows.length === 0) {
        console.error(`[PATCH /schedule/facility/${dayOfWeek}] No rows found for day ${dayNum}`);
        return res.status(404).json({ error: "Facility config not found for that day" });
      }

      const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      console.log(`[PATCH /schedule/facility/${dayOfWeek}] Successfully updated ${dayNames[dayNum]}`);
      
      res.json({
        message: `${dayNames[dayNum]} facility hours updated successfully`,
        updated: {
          dayOfWeek: rows[0].day_of_week,
          startTime: rows[0].start_time,
          endTime: rows[0].end_time,
          isOperational: rows[0].is_operational,
        },
      });
    } catch (err) {
      console.error("PATCH /schedule/facility/:dayOfWeek error:", err);
      res.status(500).json({ error: `Failed to update facility config: ${err.message}` });
    }
  }
);

module.exports = router;
