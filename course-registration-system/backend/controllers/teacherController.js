const Teacher = require("../models/Teacher");

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
    const teacher = await Teacher.create(req.body);
    res.status(201).json({ success: true, data: teacher });
  } catch (error) {
    next(error);
  }
};

exports.updateTeacher = async (req, res, next) => {
  try {
    const teacher = await Teacher.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!teacher) return res.status(404).json({ success: false, message: "Không tìm thấy giảng viên" });
    res.json({ success: true, data: teacher });
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