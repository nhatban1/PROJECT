const Teacher = require("../models/Teacher");
const User = require("../models/User");

exports.getTeachers = async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const teachers = await Teacher.find().skip(skip).limit(limit);
    const total = await Teacher.countDocuments();
    res.json({ success: true, data: teachers, total, page, limit });
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
    const teacher = await Teacher.create({ fullName, department });
    const user = await User.create({
      _id: teacher._id,
      userId: teacher.teacherId,
      email: String(email || `${teacher.teacherId.toLowerCase()}@iuh.edu.vn`).trim().toLowerCase(),
      password: password || teacher.teacherId,
      fullName: fullName || teacher.fullName,
      department,
      phone,
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
      user.fullName = fullName;
    }

    if (department !== undefined) {
      teacher.department = department;
      user.department = department;
    }

    if (email !== undefined) {
      user.email = String(email).trim().toLowerCase();
    }

    if (phone !== undefined) {
      user.phone = phone;
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
    res.json({ success: true, message: "Đã xóa giảng viên" });
  } catch (error) {
    next(error);
  }
};