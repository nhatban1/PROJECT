const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Course = require('../models/Course');
const { getMongoUri } = require('../utils/mongoUri');
const { getCourseLifecycleConfig } = require('../utils/courseLifecycleConfig');

function pickTimestamp(...values) {
  for (const value of values) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value;
    }
  }

  return new Date();
}

async function migrateCourseData() {
  const uri = getMongoUri();
  await mongoose.connect(uri);

  try {
    const { lowEnrollmentMinStudents } = await getCourseLifecycleConfig();
    const courses = await Course.find({ deletedAt: { $exists: false } });

    const summary = {
      scanned: courses.length,
      updated: 0,
      openedAtSet: 0,
      qualifiedAtSet: 0,
      qualifiedAtCleared: 0,
      fullAtSet: 0,
    };

    for (const course of courses) {
      let changed = false;

      if ((course.status === 'open' || course.status === 'full') && !course.openedAt) {
        course.openedAt = pickTimestamp(course.updatedAt, course.createdAt);
        changed = true;
        summary.openedAtSet += 1;
      }

      if (course.status === 'full' && !course.fullAt) {
        course.fullAt = pickTimestamp(course.updatedAt, course.openedAt, course.createdAt);
        changed = true;
        summary.fullAtSet += 1;
      }

      if (course.currentStudents >= lowEnrollmentMinStudents) {
        if (!course.qualifiedAt) {
          course.qualifiedAt = pickTimestamp(course.fullAt, course.updatedAt, course.openedAt, course.createdAt);
          changed = true;
          summary.qualifiedAtSet += 1;
        }
      } else if (course.qualifiedAt && course.status !== 'full') {
        course.qualifiedAt = undefined;
        changed = true;
        summary.qualifiedAtCleared += 1;
      }

      if (changed) {
        await course.save();
        summary.updated += 1;
      }
    }

    console.log('[migrateCourseData] completed', summary);
  } finally {
    await mongoose.disconnect();
  }
}

migrateCourseData().catch((error) => {
  console.error('[migrateCourseData] failed', error);
  process.exit(1);
});