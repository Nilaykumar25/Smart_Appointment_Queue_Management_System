const express = require("express");

const app = express();

// Middleware
app.use(express.json());

// Routes
const scheduleRoutes = require("./routes/scheduleRoutes");

// Use routes
app.use("/api", scheduleRoutes);

// Server start
const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});