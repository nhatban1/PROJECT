const Course = require('../models/Course');
const Teacher = require('../models/Teacher');
const Semester = require('../models/Semester');

exports.getCourses = async (req, res, next) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const skip = (page - 1) * limit;
    const courses = await Course.find().populate('teacherId', 'teacherId fullName').populate('semesterId', 'semesterId name').skip(skip).limit(Number(limit));
    const total = await Course.countDocuments();
    res.json({ success: true, data: courses, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
};

exports.createCourse = async (req, res, next) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json({ success: true, data: course });
  } catch (err) { next(err); }
};

exports.getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacherId', 'teacherId fullName')
      .populate('semesterId', 'semesterId name');
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, data: course });
  } catch (err) { next(err); }
};

exports.updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!course) return res.status(404).json({ success: false, message: 'Không tìm thấy môn học' });
    res.json({ success: true, data: course });
  } catch (err) { next(err); }
};

exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Không tìm thấy môn học' });
    res.json({ success: true, message: 'Đã xóa môn học' });
  } catch (err) { next(err); }
};
