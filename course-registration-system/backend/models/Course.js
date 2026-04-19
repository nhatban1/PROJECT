const mongoose = require('mongoose');
const { generateSequentialId } = require('../utils/sequentialId');
const { calculateCoursePrice } = require('../utils/courseState');

const courseSchema = new mongoose.Schema(
  {
    _id: { type: String, trim: true },
    courseId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    credits: { type: Number, required: true, min: 1, max: 6 },
    theoryCredits: { type: Number, min: 0 },
    practiceCredits: { type: Number, min: 0 },
    department: { type: String, trim: true },
    description: { type: String, trim: true },
    teacherId: { type: String, ref: 'Teacher', required: true },
    semesterId: { type: String, ref: 'Semester', required: true },
    schedule: {
      dayOfWeek: { type: Number, required: true, min: 1, max: 7 },
      startPeriod: { type: Number, required: true, min: 1, max: 12 },
      endPeriod: { type: Number, required: true, min: 1, max: 12 },
      room: { type: String, trim: true }
    },
    price: { type: Number, default: 0, min: 0 },
    maxStudents: { type: Number, default: 10 },
    currentStudents: { type: Number, default: 0 },
    fullAt: Date,
    cancelledAt: Date,
    cancelReason: { type: String, trim: true },
    deletedAt: Date,
    status: { type: String, enum: ['planned', 'open', 'closed', 'full'], default: 'open' }
  },
  { timestamps: true }
);

courseSchema.pre('validate', async function (next) {
  if (!this.isNew) return next();

  if (!this._id) {
    this._id = await generateSequentialId(this.constructor, 'MH');
  }

  if (!this.courseId) {
    this.courseId = this._id;
  }

  this.price = calculateCoursePrice(this);

  next();
});

courseSchema.pre("save", function (next) {
  this.price = calculateCoursePrice(this);
  next();
});

module.exports = mongoose.model('Course', courseSchema);