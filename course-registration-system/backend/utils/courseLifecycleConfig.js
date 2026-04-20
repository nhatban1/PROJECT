const COURSE_LIFECYCLE_CONFIG_ID = 'course-lifecycle-default';

const DEFAULT_COURSE_LIFECYCLE_CONFIG = Object.freeze({
  plannedToOpenDays: 7,
  fullToCloseDays: 30,
  lowEnrollmentMinStudents: 2,
  lowEnrollmentCancelDays: 14,
});

function toNumber(value, fallback) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function normalizeCourseLifecycleConfig(config = {}) {
  return {
    _id: config._id || COURSE_LIFECYCLE_CONFIG_ID,
    plannedToOpenDays: toNumber(config.plannedToOpenDays, DEFAULT_COURSE_LIFECYCLE_CONFIG.plannedToOpenDays),
    fullToCloseDays: toNumber(config.fullToCloseDays, DEFAULT_COURSE_LIFECYCLE_CONFIG.fullToCloseDays),
    lowEnrollmentMinStudents: toNumber(
      config.lowEnrollmentMinStudents,
      DEFAULT_COURSE_LIFECYCLE_CONFIG.lowEnrollmentMinStudents,
    ),
    lowEnrollmentCancelDays: toNumber(
      config.lowEnrollmentCancelDays,
      DEFAULT_COURSE_LIFECYCLE_CONFIG.lowEnrollmentCancelDays,
    ),
  };
}

async function ensureCourseLifecycleConfig() {
  const CourseLifecycleConfig = require('../models/CourseLifecycleConfig');
  const config = await CourseLifecycleConfig.ensureDefault();
  return normalizeCourseLifecycleConfig(config?.toObject ? config.toObject() : config);
}

async function getCourseLifecycleConfig() {
  try {
    return await ensureCourseLifecycleConfig();
  } catch (error) {
    return normalizeCourseLifecycleConfig();
  }
}

module.exports = {
  COURSE_LIFECYCLE_CONFIG_ID,
  DEFAULT_COURSE_LIFECYCLE_CONFIG,
  normalizeCourseLifecycleConfig,
  ensureCourseLifecycleConfig,
  getCourseLifecycleConfig,
};