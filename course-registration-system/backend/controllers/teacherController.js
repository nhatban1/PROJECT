const Teacher = require("../models/Teacher");
const User = require("../models/User");
const { hydrateProfilesWithAccounts } = require("../utils/profileHydration");

exports.getTeachers = async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const teachers = await Teacher.find().skip(skip).limit(limit);
    const total = await Teacher.countDocuments();
    const mergedTeachers = await hydrateProfilesWithAccounts(teachers, 'teacher');
    res.json({ success: true, data: mergedTeachers, total, page, limit });
  } catch (error) {
    next(error);
  }
};

exports.getTeacher = async (req, res, next) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ success: false, message: "Không tìm thấy giảng viên" });
    res.json({ success: true, data: teacher });
  } catch (error) {
    next(error);
  }
};

exports.createTeacher = async (req, res, next) => {
  try {
    const { email, password, fullName, department, phone, isActive = true } = req.body;
    const teacher = await Teacher.create({ fullName: fullName || 'Giảng viên', department, phone });
    const user = await User.create({
      _id: teacher._id,
      userId: teacher.teacherId,
      email: String(email || `${teacher.teacherId.toLowerCase()}@iuh.edu.vn`).trim().toLowerCase(),
      password: password || teacher.teacherId,
      role: "teacher",
      isActive,
    });

    const safeUser = user.toObject();
    delete safeUser.password;
    res.status(201).json({ success: true, data: { teacher, user: safeUser } });
  } catch (error) {
    next(error);
  }
};

exports.updateTeacher = async (req, res, next) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    const user = await User.findById(req.params.id);

    if (!teacher || !user) return res.status(404).json({ success: false, message: "Không tìm thấy giảng viên" });

    const { fullName, department, email, phone, password, isActive } = req.body;

    if (fullName !== undefined) {
      teacher.fullName = fullName;
    }

    if (department !== undefined) {
      teacher.department = department;
    }

    if (phone !== undefined) {
      teacher.phone = phone;
    }

    if (email !== undefined) {
      user.email = String(email).trim().toLowerCase();
    }

    if (phone !== undefined) {
      // phone is stored on the teacher profile only
    }

    if (isActive !== undefined) {
      user.isActive = isActive;
    }

    if (password) {
      user.password = password;
    }

    await Promise.all([teacher.save(), user.save()]);

    const safeUser = user.toObject();
    delete safeUser.password;
    res.json({ success: true, data: { teacher, user: safeUser } });
  } catch (error) {
    next(error);
  }
};

exports.deleteTeacher = async (req, res, next) => {
  try {
    const teacher = await Teacher.findByIdAndDelete(req.params.id);
    if (!teacher) return res.status(404).json({ success: false, message: "Không tìm thấy giảng viên" });
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Đã xóa giảng viên" });
  } catch (error) {
    next(error);
  }
};