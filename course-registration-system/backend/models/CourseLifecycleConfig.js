const mongoose = require('mongoose');
const {
  COURSE_LIFECYCLE_CONFIG_ID,
  DEFAULT_COURSE_LIFECYCLE_CONFIG,
} = require('../utils/courseLifecycleConfig');

const courseLifecycleConfigSchema = new mongoose.Schema(
  {
    _id: { type: String, trim: true, default: COURSE_LIFECYCLE_CONFIG_ID },
    plannedToOpenDays: { type: Number, default: DEFAULT_COURSE_LIFECYCLE_CONFIG.plannedToOpenDays, min: 0 },
    fullToCloseDays: { type: Number, default: DEFAULT_COURSE_LIFECYCLE_CONFIG.fullToCloseDays, min: 0 },
    lowEnrollmentMinStudents: { type: Number, default: DEFAULT_COURSE_LIFECYCLE_CONFIG.lowEnrollmentMinStudents, min: 1 },
    lowEnrollmentCancelDays: { type: Number, default: DEFAULT_COURSE_LIFECYCLE_CONFIG.lowEnrollmentCancelDays, min: 0 },
  },
  { timestamps: true }
);

courseLifecycleConfigSchema.statics.ensureDefault = async function () {
  return this.findOneAndUpdate(
    { _id: COURSE_LIFECYCLE_CONFIG_ID },
    {
      $setOnInsert: {
        _id: COURSE_LIFECYCLE_CONFIG_ID,
        ...DEFAULT_COURSE_LIFECYCLE_CONFIG,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );
};

module.exports = mongoose.model('CourseLifecycleConfig', courseLifecycleConfigSchema);