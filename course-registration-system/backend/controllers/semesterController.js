const Semester = require("../models/Semester");

exports.getSemesters = async (req, res, next) => {
  try {
    const { page, limit, skip } = req.pagination;
    const semesters = await Semester.find().skip(skip).limit(limit);
    const total = await Semester.countDocuments();
    res.json({ success: true, data: semesters, total, page, limit });
  } catch (error) {
    next(error);
  }
};

exports.getSemester = async (req, res, next) => {
  try {
    const semester = await Semester.findById(req.params.id);
    if (!semester) return res.status(404).json({ success: false, message: "Không tìm thấy học kỳ" });
    res.json({ success: true, data: semester });
  } catch (error) {
    next(error);
  }
};

exports.createSemester = async (req, res, next) => {
  try {
    const semester = await Semester.create(req.body);
    res.status(201).json({ success: true, data: semester });
  } catch (error) {
    next(error);
  }
};

exports.updateSemester = async (req, res, next) => {
  try {
    const semester = await Semester.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!semester) return res.status(404).json({ success: false, message: "Không tìm thấy học kỳ" });
    res.json({ success: true, data: semester });
  } catch (error) {
    next(error);
  }
};

exports.deleteSemester = async (req, res, next) => {
  try {
    const semester = await Semester.findByIdAndDelete(req.params.id);
    if (!semester) return res.status(404).json({ success: false, message: "Không tìm thấy học kỳ" });
    res.json({ success: true, message: "Đã xóa học kỳ" });
  } catch (error) {
    next(error);
  }
};

exports.getActiveSemester = async (req, res, next) => {
  try {
    const semester = await Semester.findOne({ status: "registration" });
    res.json({ success: true, data: semester });
  } catch (error) {
    next(error);
  }
};