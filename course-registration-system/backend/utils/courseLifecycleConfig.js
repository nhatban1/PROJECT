const COURSE_LIFECYCLE_CONFIG_ID = 'course-lifecycle-default';

const DEFAULT_COURSE_LIFECYCLE_CONFIG = Object.freeze({
  plannedToOpenDays: 7,
  fullToCloseDays: 30,
  lowEnrollmentMinStudents: 2,
  lowEnrollmentCancelDays: 14,
});

function toOptionalNumber(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : undefined;
}

function toNumber(value, fallback) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function getLifecycleDurationMs(days, minutes) {
  if (typeof minutes === 'number' && Number.isFinite(minutes)) {
    return Math.max(minutes, 0) * 60 * 1000;
  }

  if (typeof days === 'number' && Number.isFinite(days)) {
    return Math.max(days, 0) * 24 * 60 * 60 * 1000;
  }

  return 0;
}

const runtimeOverrides = Object.freeze({
  plannedToOpenMinutes: toOptionalNumber(process.env.COURSE_LIFECYCLE_PLANNED_TO_OPEN_MINUTES),
  fullToCloseMinutes: toOptionalNumber(process.env.COURSE_LIFECYCLE_FULL_TO_CLOSE_MINUTES),
  lowEnrollmentCancelMinutes: toOptionalNumber(process.env.COURSE_LIFECYCLE_LOW_ENROLLMENT_CANCEL_MINUTES),
});

function normalizeCourseLifecycleConfig(config = {}) {
  return {
    _id: config._id || COURSE_LIFECYCLE_CONFIG_ID,
    plannedToOpenDays: toNumber(config.plannedToOpenDays, DEFAULT_COURSE_LIFECYCLE_CONFIG.plannedToOpenDays),
    plannedToOpenMinutes: runtimeOverrides.plannedToOpenMinutes,
    fullToCloseDays: toNumber(config.fullToCloseDays, DEFAULT_COURSE_LIFECYCLE_CONFIG.fullToCloseDays),
    fullToCloseMinutes: runtimeOverrides.fullToCloseMinutes,
    lowEnrollmentMinStudents: toNumber(
      config.lowEnrollmentMinStudents,
      DEFAULT_COURSE_LIFECYCLE_CONFIG.lowEnrollmentMinStudents,
    ),
    lowEnrollmentCancelDays: toNumber(
      config.lowEnrollmentCancelDays,
      DEFAULT_COURSE_LIFECYCLE_CONFIG.lowEnrollmentCancelDays,
    ),
    lowEnrollmentCancelMinutes: runtimeOverrides.lowEnrollmentCancelMinutes,
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
  getLifecycleDurationMs,
  normalizeCourseLifecycleConfig,
  ensureCourseLifecycleConfig,
  getCourseLifecycleConfig,
};