const Course = require('../models/Course');
const Registration = require('../models/Registration');
const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Semester = require('../models/Semester');

exports.stats = async (req, res, next) => {
  try {
    const activeSemester = await Semester.findOne({ status: 'registration' }).select('semesterId name status').lean();

    if (req.user.role === 'student') {
      const registeredRegistrations = await Registration.find({ studentId: req.user._id, status: 'registered' })
        .populate('courseId', 'courseId name teacherId semesterId schedule maxStudents currentStudents status price')
        .populate('semesterId', 'semesterId name status startDate endDate registrationStart registrationEnd')
        .sort({ createdAt: -1 })
        .lean();

      const openCourseFilter = activeSemester ? { semesterId: activeSemester._id, status: 'open' } : { status: 'open' };
      const openCourseCount = await Course.countDocuments(openCourseFilter);

      return res.json({
        success: true,
        data: {
          role: 'student',
          activeSemester,
          registeredCourseCount: registeredRegistrations.length,
          openCourseCount,
          registrations: registeredRegistrations,
        },
      });
    }

    if (req.user.role === 'teacher') {
      const teacherCourseFilter = { teacherId: req.user._id };
      if (activeSemester?._id) {
        teacherCourseFilter.semesterId = activeSemester._id;
      }

      const courses = await Course.find(teacherCourseFilter)
        .populate('semesterId', 'semesterId name status startDate endDate registrationStart registrationEnd')
        .sort({ createdAt: -1 })
        .lean();

      const courseIds = courses.map((course) => course._id);
      const totalRegisteredStudents = courseIds.length > 0
        ? await Registration.countDocuments({ courseId: { $in: courseIds }, status: 'registered' })
        : 0;

      return res.json({
        success: true,
        data: {
          role: 'teacher',
          activeSemester,
          courseCount: courses.length,
          totalRegisteredStudents,
          courses,
        },
      });
    }

    const [studentCount, teacherCount, courseCount, registrationCount] = await Promise.all([
      Student.countDocuments(),
      Teacher.countDocuments(),
      Course.countDocuments(),
      Registration.countDocuments({ status: 'registered' }),
    ]);

    res.json({
      success: true,
      data: {
        role: 'admin',
        studentCount,
        teacherCount,
        courseCount,
        registrationCount,
      },
    });
  } catch (err) { next(err); }
};

// backward-compatible name used by routes
exports.getStats = exports.stats;
