const mongoose = require("mongoose");
const crypto = require("crypto");
const User = require("../models/User");
const Teacher = require("../models/Teacher");
const Semester = require("../models/Semester");
const Course = require("../models/Course");
const CourseLifecycleConfig = require("../models/CourseLifecycleConfig");
const Registration = require("../models/Registration");
const Notification = require("../models/Notification");
const { getMongoUri } = require("../utils/mongoUri");

const PRICE_PER_CREDIT = 750000;
const teacherRoster = [
  { department: "Kỹ thuật phần mềm", fullName: "ThS. Phạm Quảng Tri" },
  { department: "Kỹ thuật phần mềm", fullName: "TS. Tôn Long Phước" },
  { department: "Kỹ thuật phần mềm", fullName: "TS. Nguyễn Thị Hạnh (Trưởng bộ môn)" },
  { department: "Kỹ thuật phần mềm", fullName: "ThS. Bùi Đình Tiền" },
  { department: "Kỹ thuật phần mềm", fullName: "ThS. Châu Thị Bảo Hà" },
  { department: "Khoa học máy tính", fullName: "TS. Lê Nhật Duy (Trưởng khoa)" },
  { department: "Khoa học máy tính", fullName: "TS. Hồ Đắc Quán (Trưởng bộ môn)" },
  { department: "Khoa học máy tính", fullName: "TS. Phạm Thị Thiết (Phó bộ môn)" },
  { department: "Công nghệ thông tin", fullName: "TS. Tạ Duy Công Chiến (Trưởng bộ môn)" },
  { department: "Công nghệ thông tin", fullName: "TS. Trần Thị Minh Khoa" }
];

const pad = (value) => String(value).padStart(3, "0");
const buildEmail = (code) => `${code.toLowerCase()}@iuh.edu.vn`;
const studentDepartment = "Công nghệ thông tin";
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

function generateRandomPhone(usedPhones) {
  let phoneNumber = "";

  do {
    phoneNumber = `09${String(crypto.randomInt(0, 100000000)).padStart(8, "0")}`;
  } while (usedPhones.has(phoneNumber));

  usedPhones.add(phoneNumber);
  return phoneNumber;
}

const seed = async () => {
  await Promise.all([
    User.deleteMany(),
    Teacher.deleteMany(),
    Semester.deleteMany(),
    Course.deleteMany(),
    CourseLifecycleConfig.deleteMany(),
    Registration.deleteMany(),
    Notification.deleteMany()
  ]);

  await CourseLifecycleConfig.create({
    _id: "course-lifecycle-default",
    plannedToOpenDays: 7,
    fullToCloseDays: 30,
    lowEnrollmentMinStudents: 2,
    lowEnrollmentCancelDays: 14,
  });

  const admin = await User.create({
    _id: "AD001",
    userId: "AD001",
    email: "admin@iuh.edu.vn",
    password: "AD001",
    fullName: "Admin System",
    role: "admin"
  });

  const teacherSeeds = [];
  const teacherUserSeeds = [];
  let teacherIndex = 1;
  const usedTeacherPhones = new Set();
  const usedStudentPhones = new Set();

  for (const teacher of teacherRoster) {
    const teacherCode = `GV${pad(teacherIndex)}`;
    const email = buildEmail(teacherCode);

    teacherSeeds.push({
      _id: teacherCode,
      teacherId: teacherCode,
      fullName: teacher.fullName,
      department: teacher.department
    });

    teacherUserSeeds.push({
      _id: teacherCode,
      userId: teacherCode,
      email,
      password: teacherCode,
      fullName: teacher.fullName,
      phone: generateRandomPhone(usedTeacherPhones),
      department: teacher.department,
      role: "teacher"
    });

    teacherIndex += 1;
  }

  const studentUserSeeds = Array.from({ length: 12 }, (_, index) => {
    const studentNumber = index + 1;
    const studentCode = `SV${pad(studentNumber)}`;
    const email = buildEmail(studentCode);

    return {
      _id: studentCode,
      userId: studentCode,
      email,
      password: studentCode,
      fullName: `Sinh viên ${pad(studentNumber)}`,
      phone: generateRandomPhone(usedStudentPhones),
      department: studentDepartment,
      role: "student",
      academicYear: "2025-2026"
    };
  });

  const teachers = await Teacher.insertMany(teacherSeeds);
  const teacherUsers = await User.create(teacherUserSeeds);
  const students = await User.create(studentUserSeeds);

  const teacherById = teachers.reduce((accumulator, teacher) => {
    accumulator[teacher.teacherId] = teacher;
    return accumulator;
  }, {});

  const semesters = await Semester.insertMany([
    {
      _id: "HK001",
      semesterId: "HK001",
      name: "Học kỳ 1 - 2026",
      startDate: new Date("2026-01-10"),
      endDate: new Date("2026-05-15"),
      registrationStart: new Date("2026-01-01"),
      registrationEnd: new Date("2026-01-20"),
      maxCredits: 24,
      status: "registration"
    },
    {
      _id: "HK002",
      semesterId: "HK002",
      name: "Học kỳ 2 - 2026",
      startDate: new Date("2026-08-01"),
      endDate: new Date("2026-12-15"),
      registrationStart: new Date("2026-07-15"),
      registrationEnd: new Date("2026-07-30"),
      maxCredits: 24,
      status: "planned"
    },
    {
      _id: "HK003",
      semesterId: "HK003",
      name: "Học kỳ 2 - 2025",
      startDate: new Date("2025-08-01"),
      endDate: new Date("2025-12-15"),
      registrationStart: new Date("2025-07-15"),
      registrationEnd: new Date("2025-07-30"),
      maxCredits: 24,
      status: "closed"
    },
    {
      _id: "HK004",
      semesterId: "HK004",
      name: "Học kỳ 1 - 2025",
      startDate: new Date("2025-01-10"),
      endDate: new Date("2025-05-15"),
      registrationStart: new Date("2024-12-20"),
      registrationEnd: new Date("2025-01-05"),
      maxCredits: 24,
      status: "closed"
    }
  ]);

  const courses = await Course.insertMany([
    {
      _id: "MH001",
      courseId: "MH001",
      name: "Nhập môn Kỹ thuật phần mềm",
      department: "Kỹ thuật phần mềm",
      description: "Tổng quan về quy trình phát triển và quản lý phần mềm.",
      credits: 3,
      price: 1200000,
      fullAt: daysAgo(10),
      teacherId: teacherById.GV001._id,
      semesterId: semesters[0]._id,
      schedule: { dayOfWeek: 2, startPeriod: 1, endPeriod: 3, room: "A101" },
      maxStudents: 10,
      currentStudents: 10,
      status: "full"
    },
    {
      _id: "MH002",
      courseId: "MH002",
      name: "Cấu trúc dữ liệu và giải thuật",
      department: "Khoa học máy tính",
      description: "Các cấu trúc dữ liệu nền tảng và giải thuật cơ bản.",
      credits: 3,
      price: 1200000,
      theoryCredits: 2,
      practiceCredits: 1,
      teacherId: teacherById.GV002._id,
      semesterId: semesters[0]._id,
      schedule: { dayOfWeek: 3, startPeriod: 1, endPeriod: 3, room: "B201" },
      maxStudents: 10,
      currentStudents: 1,
      status: "open"
    },
    {
      _id: "MH003",
      courseId: "MH003",
      name: "Mạng máy tính căn bản",
      department: "Công nghệ thông tin",
      description: "Kiến thức nhập môn về mạng máy tính và truyền thông dữ liệu.",
      credits: 3,
      price: 1200000,
      theoryCredits: 2,
      practiceCredits: 1,
      teacherId: teacherById.GV003._id,
      semesterId: semesters[0]._id,
      schedule: { dayOfWeek: 4, startPeriod: 2, endPeriod: 4, room: "C301" },
      maxStudents: 10,
      currentStudents: 1,
      status: "open"
    },
    {
      _id: "MH004",
      courseId: "MH004",
      name: "Hệ quản trị cơ sở dữ liệu",
      department: "Hệ thống thông tin",
      description: "Thiết kế, truy vấn và vận hành hệ quản trị cơ sở dữ liệu.",
      credits: 3,
      price: 1200000,
      teacherId: teacherById.GV004._id,
      semesterId: semesters[0]._id,
      schedule: { dayOfWeek: 5, startPeriod: 1, endPeriod: 3, room: "D401" },
      maxStudents: 10,
      currentStudents: 0,
      status: "open"
    },
    {
      _id: "MH005",
      courseId: "MH005",
      name: "Nhập môn khoa học dữ liệu",
      department: "Khoa học dữ liệu",
      description: "Cách thu thập, xử lý và phân tích dữ liệu ở mức nhập môn.",
      credits: 3,
      price: 1200000,
      teacherId: teacherById.GV005._id,
      semesterId: semesters[0]._id,
      schedule: { dayOfWeek: 6, startPeriod: 1, endPeriod: 3, room: "E501" },
      maxStudents: 10,
      currentStudents: 0,
      status: "open"
    },
    {
      _id: "MH006",
      courseId: "MH006",
      name: "Lập trình hướng đối tượng",
      department: "Công nghệ thông tin",
      description: "Tư duy thiết kế phần mềm theo hướng đối tượng và thực hành OOP.",
      credits: 3,
      price: 1200000,
      theoryCredits: 2,
      practiceCredits: 1,
      teacherId: teacherById.GV006._id,
      semesterId: semesters[0]._id,
      schedule: { dayOfWeek: 2, startPeriod: 4, endPeriod: 6, room: "C302" },
      maxStudents: 10,
      currentStudents: 0,
      status: "open"
    },
    {
      _id: "MH007",
      courseId: "MH007",
      name: "Cơ sở dữ liệu",
      department: "Công nghệ thông tin",
      description: "Thiết kế, truy vấn và quản trị cơ sở dữ liệu quan hệ.",
      credits: 3,
      price: 1200000,
      teacherId: teacherById.GV007._id,
      semesterId: semesters[0]._id,
      schedule: { dayOfWeek: 3, startPeriod: 4, endPeriod: 6, room: "C303" },
      maxStudents: 10,
      currentStudents: 0,
      status: "open"
    },
    {
      _id: "MH008",
      courseId: "MH008",
      name: "Phân tích và thiết kế hệ thống",
      department: "Công nghệ thông tin",
      description: "Phân tích yêu cầu và mô hình hóa hệ thống phần mềm.",
      credits: 3,
      price: 1200000,
      theoryCredits: 2,
      practiceCredits: 1,
      teacherId: teacherById.GV008._id,
      semesterId: semesters[0]._id,
      schedule: { dayOfWeek: 4, startPeriod: 4, endPeriod: 6, room: "C304" },
      maxStudents: 10,
      currentStudents: 0,
      status: "open"
    },
    {
      _id: "MH009",
      courseId: "MH009",
      name: "An toàn thông tin",
      department: "Công nghệ thông tin",
      description: "Các nguyên tắc cơ bản về an toàn, bảo mật và phòng vệ hệ thống.",
      credits: 3,
      price: 1200000,
      teacherId: teacherById.GV009._id,
      semesterId: semesters[0]._id,
      schedule: { dayOfWeek: 5, startPeriod: 1, endPeriod: 3, room: "C305" },
      maxStudents: 10,
      currentStudents: 0,
      status: "open"
    },
    {
      _id: "MH010",
      courseId: "MH010",
      name: "Mạng máy tính nâng cao",
      department: "Công nghệ thông tin",
      description: "Mô hình mạng, định tuyến và các khái niệm nâng cao trong mạng.",
      credits: 3,
      price: 1200000,
      theoryCredits: 2,
      practiceCredits: 1,
      teacherId: teacherById.GV010._id,
      semesterId: semesters[0]._id,
      schedule: { dayOfWeek: 6, startPeriod: 4, endPeriod: 6, room: "C306" },
      maxStudents: 10,
      currentStudents: 0,
      status: "planned"
    }
  ]);

  for (const course of courses) {
    course.price = Number(course.credits || 0) * PRICE_PER_CREDIT;
  }

  await Promise.all(courses.map((course) => course.save()));

  await Registration.insertMany([
    {
      _id: "DK001",
      studentId: students[0]._id,
      courseId: courses[0]._id,
      semesterId: semesters[0]._id,
      status: "registered"
    },
    {
      _id: "DK002",
      studentId: students[1]._id,
      courseId: courses[0]._id,
      semesterId: semesters[0]._id,
      status: "registered"
    },
    {
      _id: "DK003",
      studentId: students[2]._id,
      courseId: courses[0]._id,
      semesterId: semesters[0]._id,
      status: "registered"
    },
    {
      _id: "DK004",
      studentId: students[3]._id,
      courseId: courses[0]._id,
      semesterId: semesters[0]._id,
      status: "registered"
    },
    {
      _id: "DK005",
      studentId: students[4]._id,
      courseId: courses[0]._id,
      semesterId: semesters[0]._id,
      status: "registered"
    },
    {
      _id: "DK006",
      studentId: students[5]._id,
      courseId: courses[0]._id,
      semesterId: semesters[0]._id,
      status: "registered"
    },
    {
      _id: "DK007",
      studentId: students[6]._id,
      courseId: courses[0]._id,
      semesterId: semesters[0]._id,
      status: "registered"
    },
    {
      _id: "DK008",
      studentId: students[7]._id,
      courseId: courses[0]._id,
      semesterId: semesters[0]._id,
      status: "registered"
    },
    {
      _id: "DK009",
      studentId: students[8]._id,
      courseId: courses[0]._id,
      semesterId: semesters[0]._id,
      status: "registered"
    },
    {
      _id: "DK010",
      studentId: students[9]._id,
      courseId: courses[0]._id,
      semesterId: semesters[0]._id,
      status: "registered"
    },
    {
      _id: "DK011",
      studentId: students[0]._id,
      courseId: courses[1]._id,
      semesterId: semesters[0]._id,
      status: "registered"
    },
    {
      _id: "DK012",
      studentId: students[1]._id,
      courseId: courses[2]._id,
      semesterId: semesters[0]._id,
      status: "registered"
    }
  ]);

  await Notification.create({
    _id: "TB001",
    title: "Chào mừng",
    message: "Hệ thống đăng ký môn học đã sẵn sàng.",
    targetRole: "all",
    createdBy: admin._id
  });

  console.log(
    `Seed data đã được tạo: 1 admin, ${teacherUsers.length} giảng viên, ${students.length} sinh viên, 10 môn học mẫu.`
  );
};

const run = async () => {
  const dbUri = getMongoUri();
  await mongoose.connect(dbUri);
  try {
    await seed();
  } finally {
    await mongoose.disconnect();
  }
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});