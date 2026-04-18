const Course = require('../models/Course');
const Registration = require('../models/Registration');

const AUTO_CANCEL_MINUTES = Number(process.env.COURSE_AUTO_CANCEL_MINUTES || 30);
const CHECK_INTERVAL_MS = Number(process.env.COURSE_AUTO_CANCEL_CHECK_INTERVAL_MS || 5 * 60 * 1000);
const MINIMUM_STUDENTS = Number(process.env.COURSE_MINIMUM_STUDENTS || 2);

let lifecycleTimer = null;

async function cancelUnderfilledCourses() {
  const thresholdDate = new Date(Date.now() - AUTO_CANCEL_MINUTES * 60 * 1000);

  const candidates = await Course.find({
    deletedAt: { $exists: false },
    status: 'open',
    currentStudents: { $lt: MINIMUM_STUDENTS },
    createdAt: { $lte: thresholdDate },
  });

  for (const course of candidates) {
    const now = new Date();

    await Registration.updateMany(
      { courseId: course._id, status: 'registered' },
      {
        $set: {
          status: 'cancelled',
          cancelledAt: now,
          cancelReason: 'Lớp học tự động hủy vì không đủ 2 sinh viên',
        },
      }
    );

    course.currentStudents = 0;
    course.status = 'closed';
    course.cancelledAt = now;
    course.cancelReason = 'Lớp học tự động hủy vì không đủ 2 sinh viên';
    await course.save();
  }
}

function startCourseLifecycleJobs() {
  if (lifecycleTimer) {
    return;
  }

  const runCheck = async () => {
    try {
      await cancelUnderfilledCourses();
    } catch (error) {
      console.error('Course lifecycle check failed', error);
    }
  };

  void runCheck();
  lifecycleTimer = setInterval(runCheck, CHECK_INTERVAL_MS);

  if (typeof lifecycleTimer.unref === 'function') {
    lifecycleTimer.unref();
  }
}

module.exports = {
  startCourseLifecycleJobs,
  cancelUnderfilledCourses,
};