const express = require("express");
const router = express.Router();

// POST /schedules
router.post("/schedules", (req, res) => {
    res.status(201).json({
        message: "POST /schedules working (stub)"
    });
});

// GET /schedules/:doctorId
router.get("/schedules/:doctorId", (req, res) => {
    const { doctorId } = req.params;

    res.status(200).json({
        message: "Schedules fetched successfully",
        data: [
            {
                doctorId: doctorId,
                date: "2026-03-25",
                startTime: "10:00",
                endTime: "14:00",
                slotDuration: 30
            }
        ]
    });
});

module.exports = router;