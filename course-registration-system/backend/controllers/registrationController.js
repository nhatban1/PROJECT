const Registration = require('../models/Registration');
const Course = require('../models/Course');
const Semester = require('../models/Semester');
const User = require('../models/User');
const { applyCourseStatus, resolveCourseStatus } = require('../utils/courseState');

const MAX_SEMESTER_CREDITS = 20;

async function getRegisteredCredits(studentId, semesterId, excludedRegistrationId) {
  const filter = {
    studentId,
    semesterId,
    status: 'registered',
  };

  if (excludedRegistrationId) {
    filter._id = { $ne: excludedRegistrationId };
  }

  const registrations = await Registration.find(filter).populate('courseId', 'credits');

  return registrations.reduce((totalCredits, registration) => {
    if (!registration.courseId || typeof registration.courseId === 'string') {
      return totalCredits;
    }

    return totalCredits + Number(registration.courseId.credits || 0);
  }, 0);
}

async function ensureCreditLimit(studentId, semesterId, courseCredits, excludedRegistrationId) {
  const currentCredits = await getRegisteredCredits(studentId, semesterId, excludedRegistrationId);
  if (currentCredits + Number(courseCredits || 0) > MAX_SEMESTER_CREDITS) {
    return false;
  }

  return true;
}

function syncCourseStatusFromCapacity(course) {
  applyCourseStatus(course, resolveCourseStatus(course));
}

exports.registerCourse = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const { courseId, semesterId } = req.body;

    if (!courseId || !semesterId) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin môn học hoặc học kỳ' });
    }

    const semester = await Semester.findById(semesterId);
    if (!semester) return res.status(404).json({ success: false, message: 'Học kỳ không tồn tại' });
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Môn học không tồn tại' });
    if (course.deletedAt) return res.status(404).json({ success: false, message: 'Môn học không tồn tại' });
    if (String(course.semesterId) !== String(semesterId)) {
      return res.status(400).json({ success: false, message: 'Môn học không thuộc học kỳ đã chọn' });
    }
    if (course.status !== 'open') return res.status(400).json({ success: false, message: 'Môn học hiện không mở đăng ký' });
    if (course.currentStudents >= course.maxStudents) return res.status(400).json({ success: false, message: 'Môn học đã đủ sĩ số' });
    const existed = await Registration.findOne({ studentId, courseId });
    if (existed && existed.status === 'registered') return res.status(409).json({ success: false, message: 'Bạn đã đăng ký môn này' });

    const creditAllowed = await ensureCreditLimit(studentId, semesterId, course.credits, existed?._id);
    if (!creditAllowed) {
      return res.status(400).json({ success: false, message: 'Sinh viên chỉ được đăng ký tối đa 20 tín chỉ trong một học kỳ' });
    }

    let registration;

    if (existed) {
      existed.status = 'registered';
      existed.cancelledAt = undefined;
      existed.cancelReason = undefined;
      registration = await existed.save();
    } else {
      registration = await Registration.create({ studentId, courseId, semesterId, status: 'registered' });
    }

    course.currentStudents += 1;
    syncCourseStatusFromCapacity(course);
    await course.save();
    res.status(existed ? 200 : 201).json({ success: true, data: registration });
  } catch (err) { next(err); }
};

exports.adminRegisterCourse = async (req, res, next) => {
  try {
    const { studentId, courseId, semesterId } = req.body;

    if (!studentId || !courseId) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin sinh viên hoặc môn học' });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sinh viên' });
    }

    const course = await Course.findById(courseId);
    if (!course || course.deletedAt) return res.status(404).json({ success: false, message: 'Môn học không tồn tại' });

    if (course.status === 'closed') {
      return res.status(400).json({ success: false, message: 'Lớp học đang đóng, hãy mở lại trước khi chèn sinh viên' });
    }

    const resolvedSemesterId = semesterId || course.semesterId;
    const semester = await Semester.findById(resolvedSemesterId);
    if (!semester) return res.status(404).json({ success: false, message: 'Học kỳ không tồn tại' });

    if (String(course.semesterId) !== String(resolvedSemesterId)) {
      return res.status(400).json({ success: false, message: 'Môn học không thuộc học kỳ đã chọn' });
    }

    const existed = await Registration.findOne({ studentId, courseId });
    if (existed && existed.status === 'registered') {
      return res.status(409).json({ success: false, message: 'Sinh viên đã đăng ký môn này' });
    }

    const creditAllowed = await ensureCreditLimit(studentId, resolvedSemesterId, course.credits, existed?._id);
    if (!creditAllowed) {
      return res.status(400).json({ success: false, message: 'Sinh viên chỉ được đăng ký tối đa 20 tín chỉ trong một học kỳ' });
    }

    let registration;

    if (existed) {
      existed.status = 'registered';
      existed.cancelledAt = undefined;
      existed.cancelReason = undefined;
      registration = await existed.save();
    } else {
      registration = await Registration.create({ studentId, courseId, semesterId: resolvedSemesterId, status: 'registered' });
    }

    course.currentStudents += 1;
    syncCourseStatusFromCapacity(course);
    await course.save();

    res.status(existed ? 200 : 201).json({ success: true, data: registration });
  } catch (err) {
    next(err);
  }
};

exports.adminRemoveRegistration = async (req, res, next) => {
  try {
    const registration = await Registration.findOne({ _id: req.params.id, status: 'registered' });
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Đăng ký không tồn tại' });
    }

    const course = await Course.findById(registration.courseId);
    if (!course || course.deletedAt) {
      return res.status(404).json({ success: false, message: 'Môn học không tồn tại' });
    }

    registration.status = 'cancelled';
    registration.cancelledAt = new Date();
    registration.cancelReason = 'Sinh viên đã bị xóa khỏi lớp bởi quản trị viên';
    await registration.save();

    if (course.currentStudents > 0) {
      course.currentStudents -= 1;
    }

    syncCourseStatusFromCapacity(course);
    await course.save();

    res.json({ success: true, data: registration });
  } catch (err) {
    next(err);
  }
};

exports.cancelRegistration = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const registration = await Registration.findOne({ _id: req.params.id, studentId, status: 'registered' });
    if (!registration) return res.status(404).json({ success: false, message: 'Đăng ký không tồn tại' });
    registration.status = 'cancelled';
    registration.cancelledAt = new Date();
    registration.cancelReason = 'Sinh viên đã hủy đăng ký';
    await registration.save();
    const course = await Course.findById(registration.courseId);
    if (course && course.currentStudents > 0) {
      course.currentStudents -= 1;
      syncCourseStatusFromCapacity(course);
      await course.save();
    }
    res.json({ success: true, data: registration });
  } catch (err) { next(err); }
};

exports.getMyRegistrations = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const regs = await Registration.find({ studentId })
      .populate('studentId', 'userId fullName email phone department academicYear role')
      .populate('courseId', 'courseId name credits department teacherId semesterId schedule maxStudents currentStudents status price')
      .populate('semesterId', 'semesterId name status')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: regs });
  } catch (err) { next(err); }
};

exports.getCourseRegistrations = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Môn học không tồn tại' });

    if (req.user.role === 'teacher' && String(course.teacherId) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xem lớp này' });
    }

    const populatedCourse = await Course.findById(courseId)
      .populate('teacherId', 'teacherId fullName department')
      .populate('semesterId', 'semesterId name status');

    const regs = await Registration.find({ courseId, status: 'registered' })
      .populate('studentId', 'userId fullName email phone department academicYear role')
      .populate('courseId', 'courseId name credits department teacherId semesterId schedule maxStudents currentStudents status price')
      .populate('semesterId', 'semesterId name status')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      data: {
        course: populatedCourse,
        registrations: regs,
        total: regs.length,
      },
    });
  } catch (err) { next(err); }
};

exports.getRegistrations = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;
    const regs = await Registration.find()
      .populate('studentId', 'userId fullName email phone department academicYear role')
      .populate('courseId', 'courseId name credits department teacherId semesterId schedule maxStudents currentStudents status price')
      .populate('semesterId', 'semesterId name status')
      .skip(skip)
      .limit(Number(limit));
    const total = await Registration.countDocuments();
    res.json({ success: true, data: regs, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
};
