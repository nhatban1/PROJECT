const Course = require('../models/Course');
const Registration = require('../models/Registration');
const User = require('../models/User');

exports.stats = async (req, res, next) => {
  try {
    const studentCount = await User.countDocuments({ role: 'student' });
    const teacherCount = await User.countDocuments({ role: 'teacher' });
    const courseCount = await Course.countDocuments();
    const registrationCount = await Registration.countDocuments({ status: 'registered' });
    res.json({ success: true, data: { studentCount, teacherCount, courseCount, registrationCount } });
  } catch (err) { next(err); }
};

// backward-compatible name used by routes
exports.getStats = exports.stats;
