const mongoose = require("mongoose");
const crypto = require("crypto");
const User = require("../models/User");
const Teacher = require("../models/Teacher");
const Semester = require("../models/Semester");
const Course = require("../models/Course");
const Registration = require("../models/Registration");
const Notification = require("../models/Notification");

const teacherGroups = [
  {
    department: "Kỹ thuật phần mềm",
    teachers: [
      "ThS. Phạm Quảng Tri",
      "TS. Tôn Long Phước",
      "TS. Nguyễn Thị Hạnh (Trưởng bộ môn)",
      "ThS. Bùi Đình Tiền",
      "ThS. Châu Thị Bảo Hà",
      "TS. Nguyễn Minh Hải",
      "ThS. Nguyễn Thị Hoàng Khánh",
      "ThS. Nguyễn Thị Hồng Lương",
      "TS. Nguyễn Trọng Tiến",
      "ThS. Nguyễn Văn Thắng",
      "TS. Nguyễn Vũ Lâm",
      "TS. Nguyễn Đình Quyền",
      "ThS. Phạm Thanh Hùng",
      "ThS. Trần Thế Trung",
      "ThS. Trần Thị Anh Thi",
      "ThS. Đặng Thị Thu Hà (Phó bộ môn)",
      "ThS. Đặng Văn Thuận"
    ]
  },
  {
    department: "Khoa học máy tính",
    teachers: [
      "TS. Lê Nhật Duy (Trưởng khoa)",
      "TS. Hồ Đắc Quán (Trưởng bộ môn)",
      "TS. Phạm Thị Thiết (Phó bộ môn)",
      "TS. Phạm Văn Chung",
      "PGS.TS Huỳnh Tường Nguyên (Phó trưởng Khoa)",
      "TS. Đặng Thị Phúc (Phó trưởng Khoa)",
      "ThS. Bùi Công Danh",
      "ThS. Giảng Thanh Trọn (Tổ trưởng tổ kỹ thuật)",
      "TS. Lê Thị Vĩnh Thanh",
      "ThS. Lê Vũ Hạo (NCS)",
      "TS. Lê Đình Long",
      "ThS. Nguyễn Ngọc Lễ (NCS)",
      "TS. Nguyễn Thanh Chuyên",
      "TS. Nguyễn Tiến Thịnh",
      "ThS. Võ Quang Hoàng Khang",
      "TS. Võ Đăng Khoa",
      "TS. Đoàn Văn Thắng"
    ]
  },
  {
    department: "Công nghệ thông tin",
    teachers: [
      "TS. Tạ Duy Công Chiến (Trưởng bộ môn)",
      "TS. Trần Thị Minh Khoa",
      "ThS. Hoàng Đình Hạnh",
      "TS. Lê Thị Thủy",
      "ThS. NCS. Võ Công Minh (Phó bộ môn)",
      "ThS. Nguyễn Thành Thái (NCS)",
      "ThS. Nguyễn Văn Quang",
      "ThS. Nguyễn Xuân Lô",
      "ThS. Phạm Thái Khanh",
      "ThS. Trương Bá Phúc",
      "TS. Đặng Thanh Bình",
      "ThS. Đỗ Hà Phương"
    ]
  },
  {
    department: "Hệ thống thông tin",
    teachers: [
      "ThS. Trần Thị Kim Chi (Phó bộ môn)",
      "ThS. Nguyễn Phúc Hưng (NCS)",
      "TS. Ngô Hữu Dũng (Trưởng bộ môn)",
      "ThS. Bùi Văn Đồng",
      "ThS. Huỳnh Nam (NCS)",
      "ThS. Huỳnh Tấn Hát",
      "ThS. Lê Thị Ánh Tuyết",
      "ThS. Lê Thùy Trang",
      "ThS. Lê Trọng Hiền (NCS)",
      "ThS. Nguyễn Hữu Quang (NCS)",
      "ThS. Nguyễn Ngọc Dung",
      "TS. Nguyễn Tấn Hoàng",
      "ThS. Nguyễn Thị Thanh Bình",
      "ThS. Nguyễn Trần Kỹ",
      "ThS. Phạm Thị Xuân Hiền",
      "ThS. Phan Thị Bảo Trân",
      "ThS. Võ Ngọc Tấn Phước"
    ]
  },
  {
    department: "Khoa học dữ liệu",
    teachers: [
      "GS.TS. Huỳnh Trung Hiếu",
      "TS. Lê Trọng Ngọc (PGĐ trung tâm NN - TH)",
      "TS. Bùi Thanh Hùng (TTCĐ) (Trưởng bộ môn)",
      "ThS. Nguyễn Hữu Tình (Phó bộ môn)",
      "TS. Huỳnh Công Bằng",
      "PGS.TS Nguyễn Hòa",
      "TS. Nguyễn Hữu Vũ",
      "TS. Nguyễn Lê Linh",
      "TS. Nguyễn Minh Hạnh",
      "TS. Phan Hồng Tín",
      "ThS. Trần Nhật Hoàng Anh",
      "KS. Trần Tấn Thành",
      "TS. Trịnh Thanh Sơn",
      "ThS. Trương Vĩnh Linh",
      "TS. Vũ Đức Thịnh"
    ]
  }
];

const pad = (value) => String(value).padStart(3, "0");
const buildEmail = (code) => `${code.toLowerCase()}@iuh.edu.vn`;
const studentDepartment = "Công nghệ thông tin";

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
    Registration.deleteMany(),
    Notification.deleteMany()
  ]);

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
  const usedStudentPhones = new Set();

  for (const group of teacherGroups) {
    for (const fullName of group.teachers) {
      const teacherCode = `GV${pad(teacherIndex)}`;
      const email = buildEmail(teacherCode);

      teacherSeeds.push({
        _id: teacherCode,
        teacherId: teacherCode,
        fullName,
        department: group.department
      });

      teacherUserSeeds.push({
        _id: teacherCode,
        userId: teacherCode,
        email,
        password: teacherCode,
        fullName,
        department: group.department,
        role: "teacher"
      });

      teacherIndex += 1;
    }
  }

  const studentUserSeeds = Array.from({ length: 10 }, (_, index) => {
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
      teacherId: teacherById.GV001._id,
      semesterId: semesters[0]._id,
      schedule: { dayOfWeek: 2, startPeriod: 1, endPeriod: 3, room: "A101" },
      maxStudents: 40,
      currentStudents: 0,
      status: "open"
    },
    {
      _id: "MH002",
      courseId: "MH002",
      name: "Cấu trúc dữ liệu và giải thuật",
      department: "Khoa học máy tính",
      description: "Các cấu trúc dữ liệu nền tảng và giải thuật cơ bản.",
      credits: 3,
      teacherId: teacherById.GV001._id,
      semesterId: semesters[0]._id,
      schedule: { dayOfWeek: 3, startPeriod: 1, endPeriod: 3, room: "B201" },
      maxStudents: 35,
      currentStudents: 0,
      status: "open"
    },
    {
      _id: "MH003",
      courseId: "MH003",
      name: "Mạng máy tính căn bản",
      department: "Công nghệ thông tin",
      description: "Kiến thức nhập môn về mạng máy tính và truyền thông dữ liệu.",
      credits: 3,
      teacherId: teacherById.GV002._id,
      semesterId: semesters[0]._id,
      schedule: { dayOfWeek: 4, startPeriod: 2, endPeriod: 4, room: "C301" },
      maxStudents: 40,
      currentStudents: 0,
      status: "open"
    },
    {
      _id: "MH004",
      courseId: "MH004",
      name: "Hệ quản trị cơ sở dữ liệu",
      department: "Hệ thống thông tin",
      description: "Thiết kế, truy vấn và vận hành hệ quản trị cơ sở dữ liệu.",
      credits: 3,
      teacherId: teacherById.GV002._id,
      semesterId: semesters[0]._id,
      schedule: { dayOfWeek: 5, startPeriod: 1, endPeriod: 3, room: "D401" },
      maxStudents: 40,
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
      teacherId: teacherById.GV003._id,
      semesterId: semesters[0]._id,
      schedule: { dayOfWeek: 6, startPeriod: 1, endPeriod: 3, room: "E501" },
      maxStudents: 40,
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
      teacherId: teacherById.GV003._id,
      semesterId: semesters[0]._id,
      schedule: { dayOfWeek: 2, startPeriod: 4, endPeriod: 6, room: "C302" },
      maxStudents: 40,
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
      teacherId: teacherById.GV004._id,
      semesterId: semesters[0]._id,
      schedule: { dayOfWeek: 3, startPeriod: 4, endPeriod: 6, room: "C303" },
      maxStudents: 40,
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
      teacherId: teacherById.GV004._id,
      semesterId: semesters[0]._id,
      schedule: { dayOfWeek: 4, startPeriod: 4, endPeriod: 6, room: "C304" },
      maxStudents: 40,
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
      teacherId: teacherById.GV005._id,
      semesterId: semesters[0]._id,
      schedule: { dayOfWeek: 5, startPeriod: 1, endPeriod: 3, room: "C305" },
      maxStudents: 40,
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
      teacherId: teacherById.GV005._id,
      semesterId: semesters[0]._id,
      schedule: { dayOfWeek: 6, startPeriod: 4, endPeriod: 6, room: "C306" },
      maxStudents: 40,
      currentStudents: 0,
      status: "open"
    }
  ]);

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
      courseId: courses[1]._id,
      semesterId: semesters[0]._id,
      status: "registered"
    },
    {
      _id: "DK003",
      studentId: students[2]._id,
      courseId: courses[2]._id,
      semesterId: semesters[0]._id,
      status: "registered"
    }
  ]);

  courses[0].currentStudents = 1;
  courses[1].currentStudents = 1;
  courses[2].currentStudents = 1;
  await Promise.all([courses[0].save(), courses[1].save(), courses[2].save()]);

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
  const dbUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/course_registration";
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