// Implements: REQ-19 — see SRS Section 4.8 (Administrative Reporting and Logs)
// GET /api/reports/daily?date=YYYY-MM-DD           → JSON stats
// GET /api/reports/daily?date=YYYY-MM-DD&format=csv → CSV download
// GET /api/reports/daily?date=YYYY-MM-DD&format=pdf → PDF-ready HTML download

const express     = require('express');
const router      = express.Router();
const db          = require('../db/connection');
const requireRole = require('../middleware/requireRole');

// ─── Shared: fetch stats + appointment rows for a date ────────────────────────
async function fetchReportData(dateParam) {
  const dateCondition = dateParam
    ? `TO_CHAR(s.date AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') = $1`
    : `TO_CHAR(s.date AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD') = TO_CHAR((NOW() AT TIME ZONE 'Asia/Kolkata'), 'YYYY-MM-DD')`;

  const params = dateParam ? [dateParam] : [];

  const { rows: stats } = await db.query(
    `SELECT
       COUNT(*)                                              AS "totalAppointments",
       COUNT(*) FILTER (WHERE a.status = 'Completed')       AS "totalPatientsSeen",
       COUNT(*) FILTER (WHERE a.status = 'No-Show')         AS "totalNoShows",
       COUNT(*) FILTER (WHERE a.status = 'Booked')          AS "totalBooked",
       COUNT(*) FILTER (WHERE a.status = 'Arrived')         AS "totalArrived",
       COUNT(*) FILTER (WHERE a.status = 'In-Consultation') AS "totalInConsultation"
     FROM appointments a
     JOIN schedules s ON s.schedule_id = a.schedule_id
     WHERE ${dateCondition}`,
    params
  );

  const { rows: waitRows } = await db.query(
    `SELECT COALESCE(AVG(q.estimated_wait_time), 0)::int AS "avgWait"
     FROM queue q
     JOIN appointments a ON a.appointment_id = q.appointment_id
     JOIN schedules s    ON s.schedule_id = a.schedule_id
     WHERE ${dateCondition}`,
    params
  );

  // Detailed appointment rows for CSV/PDF
  const { rows: appointments } = await db.query(
    `SELECT
       u.name                                              AS "patientName",
       d.name                                              AS "doctorName",
       d.specialty                                         AS "specialty",
       TO_CHAR(s.start_time, 'HH24:MI')                   AS "scheduledTime",
       a.status,
       COALESCE(q.queue_position::text, '—')              AS "queuePosition",
       COALESCE(q.estimated_wait_time::text || ' min', '—') AS "waitTime"
     FROM appointments a
     JOIN users u     ON u.user_id     = a.patient_id
     JOIN doctors d   ON d.doctor_id   = a.doctor_id
     JOIN schedules s ON s.schedule_id = a.schedule_id
     LEFT JOIN queue q ON q.appointment_id = a.appointment_id
     WHERE ${dateCondition}
     ORDER BY s.start_time`,
    params
  );

  const s = stats[0];
  const reportDate = dateParam || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

  return {
    date:                   reportDate,
    totalAppointments:      parseInt(s.totalAppointments),
    totalPatientsSeen:      parseInt(s.totalPatientsSeen),
    totalNoShows:           parseInt(s.totalNoShows),
    totalCancellations:     0, // cancellations are recorded as Completed in this schema
    totalBooked:            parseInt(s.totalBooked),
    totalArrived:           parseInt(s.totalArrived),
    totalInConsultation:    parseInt(s.totalInConsultation),
    averageWaitTimeMinutes: parseInt(waitRows[0].avgWait),
    appointments,
  };
}

// ─── CSV builder ──────────────────────────────────────────────────────────────
function buildCSV(data) {
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

  const lines = [
    // Report header
    `SAQMS Daily Report — ${data.date}`,
    '',
    // Summary section
    'SUMMARY',
    `Date,${data.date}`,
    `Total Appointments,${data.totalAppointments}`,
    `Completed,${data.totalPatientsSeen}`,
    `No-Shows,${data.totalNoShows}`,
    `Booked,${data.totalBooked}`,
    `Arrived,${data.totalArrived}`,
    `In-Consultation,${data.totalInConsultation}`,
    `Avg Wait Time (min),${data.averageWaitTimeMinutes}`,
    '',
    // Appointment detail section
    'APPOINTMENT DETAILS',
    'Patient Name,Doctor,Specialty,Scheduled Time,Status,Queue Position,Est. Wait Time',
    ...data.appointments.map(a =>
      [
        escape(a.patientName),
        escape(a.doctorName),
        escape(a.specialty),
        escape(a.scheduledTime),
        escape(a.status),
        escape(a.queuePosition),
        escape(a.waitTime),
      ].join(',')
    ),
  ];

  return lines.join('\r\n');
}

// ─── PDF HTML builder ─────────────────────────────────────────────────────────
function buildPDFHtml(data) {
  const statusColor = {
    'Completed':       '#059669',
    'No-Show':         '#dc2626',
    'Booked':          '#2563EB',
    'Arrived':         '#d97706',
    'In-Consultation': '#7c3aed',
  };

  const rows = data.appointments.map(a => `
    <tr>
      <td>${a.patientName}</td>
      <td>${a.doctorName}</td>
      <td>${a.specialty}</td>
      <td>${a.scheduledTime}</td>
      <td><span style="color:${statusColor[a.status] || '#374151'};font-weight:700">${a.status}</span></td>
      <td style="text-align:center">${a.queuePosition}</td>
      <td style="text-align:center">${a.waitTime}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>SAQMS Report — ${data.date}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color:#111827; background:#fff; padding:32px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:28px; border-bottom:3px solid #2563EB; padding-bottom:16px; }
    .header h1 { font-size:22px; font-weight:800; color:#0F172A; }
    .header .meta { font-size:13px; color:#6B7280; text-align:right; }
    .summary { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:28px; }
    .stat { background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:14px 16px; text-align:center; }
    .stat .num { font-size:26px; font-weight:800; color:#2563EB; }
    .stat .lbl { font-size:11px; color:#6B7280; text-transform:uppercase; letter-spacing:0.5px; margin-top:4px; }
    .stat.green .num { color:#059669; }
    .stat.red   .num { color:#dc2626; }
    .stat.amber .num { color:#d97706; }
    h2 { font-size:15px; font-weight:700; color:#0F172A; margin-bottom:12px; }
    table { width:100%; border-collapse:collapse; font-size:13px; }
    thead th { background:#0F172A; color:#fff; padding:10px 12px; text-align:left; font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:0.4px; }
    tbody tr:nth-child(even) { background:#F9FAFB; }
    tbody td { padding:9px 12px; border-bottom:1px solid #E5E7EB; }
    .footer { margin-top:24px; font-size:11px; color:#9CA3AF; text-align:center; border-top:1px solid #E5E7EB; padding-top:12px; }
    @media print {
      body { padding:16px; }
      .no-print { display:none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>🏥 SAQMS — Daily Report</h1>
      <div style="font-size:14px;color:#6B7280;margin-top:4px">Smart Appointment &amp; Queue Management System</div>
    </div>
    <div class="meta">
      <div><strong>Date:</strong> ${data.date}</div>
      <div><strong>Generated:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
    </div>
  </div>

  <div class="summary">
    <div class="stat green"><div class="num">${data.totalPatientsSeen}</div><div class="lbl">Completed</div></div>
    <div class="stat red">  <div class="num">${data.totalNoShows}</div>      <div class="lbl">No-Shows</div></div>
    <div class="stat">      <div class="num">${data.totalBooked}</div>       <div class="lbl">Booked</div></div>
    <div class="stat amber"><div class="num">${data.totalArrived}</div>      <div class="lbl">Arrived</div></div>
    <div class="stat">      <div class="num">${data.totalAppointments}</div> <div class="lbl">Total</div></div>
    <div class="stat">      <div class="num">${data.averageWaitTimeMinutes} min</div><div class="lbl">Avg Wait</div></div>
  </div>

  <h2>Appointment Details</h2>
  ${data.appointments.length === 0
    ? '<p style="color:#6B7280;font-size:13px">No appointments found for this date.</p>'
    : `<table>
        <thead>
          <tr>
            <th>Patient</th><th>Doctor</th><th>Specialty</th>
            <th>Time</th><th>Status</th><th>Queue #</th><th>Wait</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`
  }

  <div class="footer">
    SAQMS — Confidential Clinical Report &nbsp;|&nbsp; Data retained 7 years per DPDP Act 2023
  </div>

  <script>
    // Auto-trigger print dialog when opened in browser
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`;
}

// ─── Route handler ────────────────────────────────────────────────────────────
router.get('/daily', requireRole(['admin']), async (req, res) => {
  const { date: dateParam, format } = req.query;

  if (dateParam && !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return res.status(400).json({ error: 'date must be in YYYY-MM-DD format' });
  }

  try {
    const data = await fetchReportData(dateParam);

    if (format === 'csv') {
      const csv = buildCSV(data);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="SAQMS-Report-${data.date}.csv"`);
      return res.send('\uFEFF' + csv); // BOM for Excel UTF-8 compatibility
    }

    if (format === 'pdf') {
      const html = buildPDFHtml(data);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `inline; filename="SAQMS-Report-${data.date}.pdf"`);
      return res.send(html);
    }

    // Default: JSON
    const { appointments: _, ...summary } = data; // exclude detail rows from JSON
    res.json(summary);

  } catch (err) {
    console.error('GET /reports/daily error:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router;
