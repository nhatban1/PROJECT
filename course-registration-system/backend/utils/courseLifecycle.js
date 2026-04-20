const Course = require('../models/Course');
const Registration = require('../models/Registration');
const { applyCourseStatus, resolveCourseStatus } = require('./courseState');
const { getCourseLifecycleConfig } = require('./courseLifecycleConfig');

const CHECK_INTERVAL_MS = Number(process.env.COURSE_LIFECYCLE_CHECK_INTERVAL_MS || 5 * 60 * 1000);

let lifecycleTimer = null;

function isOlderThan(date, days, now = new Date()) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return false;
  }

  const thresholdDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return date.getTime() <= thresholdDate.getTime();
}

async function syncCourseLifecycle() {
  const now = new Date();
  const {
    plannedToOpenDays,
    fullToCloseDays,
    lowEnrollmentMinStudents,
    lowEnrollmentCancelDays,
  } = await getCourseLifecycleConfig();

  const candidates = await Course.find({
    deletedAt: { $exists: false },
    status: { $in: ['planned', 'open', 'full'] },
  });

  for (const course of candidates) {
    if (course.status === 'planned' && isOlderThan(course.createdAt, plannedToOpenDays, now)) {
      applyCourseStatus(course, resolveCourseStatus(course, 'open'), now);
      await course.save();
      continue;
    }

    if (course.status === 'open' && course.currentStudents >= course.maxStudents) {
      applyCourseStatus(course, 'full', now);
      await course.save();
      continue;
    }

    if (course.status === 'open') {
      const openSince = course.openedAt || course.createdAt || course.updatedAt;

      if (course.currentStudents < lowEnrollmentMinStudents && isOlderThan(openSince, lowEnrollmentCancelDays, now)) {
        await Registration.updateMany(
          { courseId: course._id, status: 'registered' },
          {
            $set: {
              status: 'cancelled',
              cancelledAt: now,
              cancelReason: `Lớp học tự động hủy do không đủ ${lowEnrollmentMinStudents} sinh viên sau ${lowEnrollmentCancelDays} ngày`,
            },
          }
        );

        applyCourseStatus(course, 'closed', now);
        course.currentStudents = 0;
        course.cancelledAt = now;
        course.cancelReason = `Lớp học tự động hủy do không đủ ${lowEnrollmentMinStudents} sinh viên sau ${lowEnrollmentCancelDays} ngày`;
        await course.save();
        continue;
      }
    }

    const fullSince = course.fullAt || course.updatedAt || course.createdAt;
    if (course.status === 'full' && isOlderThan(fullSince, fullToCloseDays, now)) {
      applyCourseStatus(course, 'closed', now);
      await course.save();
    }
  }
}

function startCourseLifecycleJobs() {
  if (lifecycleTimer) {
    return;
  }

  const runCheck = async () => {
    try {
      await syncCourseLifecycle();
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
  syncCourseLifecycle,
};