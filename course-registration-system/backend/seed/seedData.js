const mongoose = require("mongoose");
const User = require("../models/User");
const Teacher = require("../models/Teacher");
const Semester = require("../models/Semester");
const Course = require("../models/Course");
const Registration = require("../models/Registration");
const Notification = require("../models/Notification");

const seed = async () => {
  await User.deleteMany();
  await Teacher.deleteMany();
  await Semester.deleteMany();
  await Course.deleteMany();
  await Registration.deleteMany();
  await Notification.deleteMany();

  const admin = await User.create({
    email: "admin@example.com",
    password: "Admin123!",
    fullName: "Admin System",
    role: "admin"
  });

  const student = await User.create({
    email: "student@example.com",
    password: "Student123!",
    fullName: "Student User",
    role: "student"
  });

  const teachers = await Teacher.insertMany([
    { teacherId: "T001", fullName: "Nguyễn Văn A", department: "Công nghệ thông tin" },
    { teacherId: "T002", fullName: "Trần Thị B", department: "Toán học" }
  ]);

  const semesters = await Semester.insertMany([
    {
      semesterId: "HK2026-1",
      name: "Học kỳ 1 - 2026",
      startDate: new Date("2026-01-10"),
      endDate: new Date("2026-05-15"),
      registrationStart: new Date("2026-01-01"),
      registrationEnd: new Date("2026-01-20"),
      maxCredits: 24,
      status: "registration"
    },
    {
      semesterId: "HK2026-2",
      name: "Học kỳ 2 - 2026",
      startDate: new Date("2026-08-01"),
      endDate: new Date("2026-12-15"),
      registrationStart: new Date("2026-07-15"),
      registrationEnd: new Date("2026-07-30"),
      maxCredits: 24,
      status: "planned"
    }
  ]);

  await Course.insertMany([
    {
      courseId: "CSE101",
      name: "Lập trình Web",
      credits: 3,
      teacherId: teachers[0]._id,
      semesterId: semesters[0]._id,
      schedule: { dayOfWeek: 2, startPeriod: 1, endPeriod: 3, room: "A101" },
      maxStudents: 40,
      currentStudents: 0,
      status: "open"
    },
    {
      courseId: "MTH102",
      name: "Toán cao cấp",
      credits: 4,
      teacherId: teachers[1]._id,
      semesterId: semesters[0]._id,
      schedule: { dayOfWeek: 4, startPeriod: 2, endPeriod: 4, room: "B202" },
      maxStudents: 35,
      currentStudents: 0,
      status: "open"
    }
  ]);

  await Notification.create({
    title: "Chào mừng",
    message: "Hệ thống đăng ký môn học đã sẵn sàng.",
    targetRole: "all",
    createdBy: admin._id
  });

  console.log("Seed data đã được tạo.");
};

const run = async () => {
  const dbUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/course_registration";
  await mongoose.connect(dbUri);
  await seed();
  mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});