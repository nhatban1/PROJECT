const Course = require('../models/Course');
const Teacher = require('../models/Teacher');
const Semester = require('../models/Semester');
const Registration = require('../models/Registration');

exports.getCourses = async (req, res, next) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const skip = (page - 1) * limit;
    const filter = { deletedAt: { $exists: false } };
    const courses = await Course.find(filter).populate('teacherId', 'teacherId fullName').populate('semesterId', 'semesterId name').skip(skip).limit(Number(limit));
    const total = await Course.countDocuments(filter);
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
    if (!course || course.deletedAt) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, data: course });
  } catch (err) { next(err); }
};

exports.updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course || course.deletedAt) return res.status(404).json({ success: false, message: 'Không tìm thấy môn học' });

    Object.assign(course, req.body);
    await course.save();
    res.json({ success: true, data: course });
  } catch (err) { next(err); }
};

exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course || course.deletedAt) return res.status(404).json({ success: false, message: 'Không tìm thấy môn học' });

    const now = new Date();
    await Registration.updateMany(
      { courseId: course._id, status: 'registered' },
      {
        $set: {
          status: 'cancelled',
          cancelledAt: now,
          cancelReason: 'Lớp học đã bị xóa bởi quản trị viên',
        },
      }
    );

    course.currentStudents = 0;
    course.status = 'closed';
    course.cancelledAt = now;
    course.cancelReason = 'Lớp học đã bị xóa bởi quản trị viên';
    course.deletedAt = now;
    await course.save();

    res.json({ success: true, message: 'Đã xóa lớp học' });
  } catch (err) { next(err); }
};
