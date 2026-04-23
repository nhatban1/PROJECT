const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const studentRoutes = require("./routes/studentRoutes");
const semesterRoutes = require("./routes/semesterRoutes");
const courseRoutes = require("./routes/courseRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const errorHandler = require("./middleware/errorHandler");
const { startCourseLifecycleJobs } = require("./utils/courseLifecycle");

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

const path = require('path');

// serve static frontend (use absolute path relative to repo root)
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// default route -> login page
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'pages', 'login.html'));
});

// api routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/semesters", semesterRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    startCourseLifecycleJobs();
    const server = app.listen(PORT, () => {
      console.log(`Server running http://localhost:${PORT}`);
    });

    server.on("error", (error) => {
      if (error && error.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use. Another backend instance may already be running.`);
        process.exit(0);
      }

      console.error("Server failed to start", error);
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error("DB connection failed", err);
    process.exit(1);
  });

module.exports = app;