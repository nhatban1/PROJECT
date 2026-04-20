const Course = require('../models/Course');
const Teacher = require('../models/Teacher');
const Semester = require('../models/Semester');
const Registration = require('../models/Registration');
const { getCourseLifecycleConfig } = require('../utils/courseLifecycleConfig');
const { applyCourseStatus, resolveCourseStatus } = require('../utils/courseState');

exports.getCourses = async (req, res, next) => {
  try {
    const activeSemester = await Semester.findOne({ status: 'registration' }).select('_id semesterId name status').lean();
    const { page = 1, limit = 30 } = req.query;
    const skip = (page - 1) * limit;
    const filter = { deletedAt: { $exists: false } };

    if (req.user.role === 'teacher') {
      filter.teacherId = req.user._id;
      if (activeSemester?._id) {
        filter.semesterId = activeSemester._id;
      }
    }

    const courses = await Course.find(filter).populate('teacherId', 'teacherId fullName').populate('semesterId', 'semesterId name status startDate endDate registrationStart registrationEnd').skip(skip).limit(Number(limit));
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
      .populate('semesterId', 'semesterId name status startDate endDate registrationStart registrationEnd');
    if (!course || course.deletedAt) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, data: course });
  } catch (err) { next(err); }
};

exports.getLifecycleConfig = async (req, res, next) => {
  try {
    const courseLifecycle = await getCourseLifecycleConfig();
    res.json({ success: true, data: courseLifecycle });
  } catch (err) {
    next(err);
  }
};

exports.updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course || course.deletedAt) return res.status(404).json({ success: false, message: 'Không tìm thấy môn học' });

    const {
      name,
      credits,
      department,
      description,
      teacherId,
      semesterId,
      schedule,
      maxStudents,
      status,
    } = req.body;

    if (name !== undefined) course.name = name;
    if (credits !== undefined) course.credits = Number(credits);
    if (department !== undefined) course.department = department;
    if (description !== undefined) course.description = description;
    if (teacherId !== undefined) course.teacherId = teacherId;
    if (semesterId !== undefined) course.semesterId = semesterId;
    if (schedule !== undefined) course.schedule = schedule;
    if (maxStudents !== undefined) course.maxStudents = Number(maxStudents);

    applyCourseStatus(course, resolveCourseStatus(course, status));
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
    applyCourseStatus(course, 'closed', now);
    course.cancelledAt = now;
    course.cancelReason = 'Lớp học đã bị xóa bởi quản trị viên';
    course.deletedAt = now;
    await course.save();

    res.json({ success: true, message: 'Đã xóa lớp học' });
  } catch (err) { next(err); }
};
