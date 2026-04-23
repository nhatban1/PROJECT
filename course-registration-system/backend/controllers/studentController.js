const Student = require('../models/Student');
const User = require('../models/User');
const { hydrateProfilesWithAccounts, hydrateProfileWithAccount } = require('../utils/profileHydration');

exports.getStudents = async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const students = await Student.find().skip(skip).limit(limit);
    const total = await Student.countDocuments();
    const mergedStudents = await hydrateProfilesWithAccounts(students, 'student');
    res.json({ success: true, data: mergedStudents, total, page, limit });
  } catch (error) {
    next(error);
  }
};

exports.getStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Không tìm thấy sinh viên' });

    const mergedStudent = await hydrateProfileWithAccount(student, 'student');
    res.json({ success: true, data: mergedStudent });
  } catch (error) {
    next(error);
  }
};

exports.createStudent = async (req, res, next) => {
  try {
    const { email, password, fullName, phone, department, academicYear, isActive = true } = req.body;
    const student = await Student.create({ fullName: fullName || 'Sinh viên', phone, department, academicYear });
    const user = await User.create({
      _id: student._id,
      userId: student.studentId,
      email: String(email || `${student.studentId.toLowerCase()}@iuh.edu.vn`).trim().toLowerCase(),
      password: password || student.studentId,
      role: 'student',
      isActive,
    });

    const mergedStudent = await hydrateProfileWithAccount(student, 'student');
    res.status(201).json({ success: true, data: mergedStudent ?? { student, user: user.toObject() } });
  } catch (error) {
    next(error);
  }
};

exports.updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    const user = await User.findById(req.params.id);

    if (!student || !user) return res.status(404).json({ success: false, message: 'Không tìm thấy sinh viên' });

    const { fullName, phone, department, academicYear, email, password, isActive } = req.body;

    if (fullName !== undefined) {
      student.fullName = fullName;
    }

    if (phone !== undefined) {
      student.phone = phone;
    }

    if (department !== undefined) {
      student.department = department;
    }

    if (academicYear !== undefined) {
      student.academicYear = academicYear;
    }

    if (email !== undefined) {
      user.email = String(email).trim().toLowerCase();
    }

    if (isActive !== undefined) {
      user.isActive = isActive;
    }

    if (password) {
      user.password = password;
    }

    await Promise.all([student.save(), user.save()]);

    const mergedStudent = await hydrateProfileWithAccount(student, 'student');
    res.json({ success: true, data: mergedStudent });
  } catch (error) {
    next(error);
  }
};

exports.deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Không tìm thấy sinh viên' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Đã xóa sinh viên' });
  } catch (error) {
    next(error);
  }
};