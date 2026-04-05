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

    // Validate required fields
    if (!doctorId || !workingDays?.length || !startTime || !endTime || !slotDuration) {
      return res.status(400).json({
        error: "doctorId, workingDays, startTime, endTime, slotDuration are all required",
      });
    }
    if (startTime >= endTime) {
      return res.status(400).json({ error: "startTime must be before endTime" });
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

      // Delete existing non-blackout schedules for this doctor in that range
      await db.query(
        `DELETE FROM schedules
         WHERE doctor_id = $1
           AND is_blackout = FALSE
           AND date >= CURRENT_DATE
           AND date < CURRENT_DATE + INTERVAL '90 days'`,
        [doctorId]
      );

      // Insert new schedule rows for each working date
      for (const date of datesToInsert) {
        await db.query(
          `INSERT INTO schedules (doctor_id, date, start_time, end_time, slot_duration, is_blackout)
           VALUES ($1, $2, $3, $4, $5, FALSE)`,
          [doctorId, date, startTime, endTime, slotDuration]
        );
      }

      res.status(201).json({
        message:       "Schedule saved successfully",
        datesScheduled: datesToInsert.length,
      });
    } catch (err) {
      console.error("POST /schedule/config error:", err);
      res.status(500).json({ error: "Failed to save schedule" });
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

module.exports = router;
