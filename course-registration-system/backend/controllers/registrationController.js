const Registration = require('../models/Registration');
const Course = require('../models/Course');
const Semester = require('../models/Semester');

exports.registerCourse = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const { courseId, semesterId } = req.body;
    const semester = await Semester.findById(semesterId);
    if (!semester) return res.status(404).json({ success: false, message: 'Học kỳ không tồn tại' });
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Môn học không tồn tại' });
    if (course.currentStudents >= course.maxStudents) return res.status(400).json({ success: false, message: 'Môn học đã đủ sĩ số' });
    const existed = await Registration.findOne({ studentId, courseId });
    if (existed && existed.status === 'registered') return res.status(409).json({ success: false, message: 'Bạn đã đăng ký môn này' });
    const registration = await Registration.create({ studentId, courseId, semesterId, status: 'registered' });
    course.currentStudents += 1;
    if (course.currentStudents >= course.maxStudents) course.status = 'full';
    await course.save();
    res.status(201).json({ success: true, data: registration });
  } catch (err) { next(err); }
};

exports.cancelRegistration = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const registration = await Registration.findOne({ _id: req.params.id, studentId, status: 'registered' });
    if (!registration) return res.status(404).json({ success: false, message: 'Đăng ký không tồn tại' });
    registration.status = 'cancelled';
    registration.cancelledAt = new Date();
    await registration.save();
    const course = await Course.findById(registration.courseId);
    if (course && course.currentStudents > 0) { course.currentStudents -= 1; if (course.status === 'full') course.status = 'open'; await course.save(); }
    res.json({ success: true, data: registration });
  } catch (err) { next(err); }
};

exports.getMyRegistrations = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const regs = await Registration.find({ studentId }).populate('studentId', 'userId fullName email role').populate('courseId').populate('semesterId');
    res.json({ success: true, data: regs });
  } catch (err) { next(err); }
};

exports.getRegistrations = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;
    const regs = await Registration.find().populate('studentId', 'userId fullName email role').populate('courseId').populate('semesterId').skip(skip).limit(Number(limit));
    const total = await Registration.countDocuments();
    res.json({ success: true, data: regs, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
};
