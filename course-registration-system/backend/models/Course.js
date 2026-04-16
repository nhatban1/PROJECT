const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    courseId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    credits: { type: Number, required: true, min: 1, max: 6 },
    department: { type: String, trim: true },
    description: { type: String, trim: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    semesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', required: true },
    schedule: {
      dayOfWeek: { type: Number, required: true, min: 1, max: 7 },
      startPeriod: { type: Number, required: true, min: 1, max: 12 },
      endPeriod: { type: Number, required: true, min: 1, max: 12 },
      room: { type: String, trim: true }
    },
    maxStudents: { type: Number, default: 50 },
    currentStudents: { type: Number, default: 0 },
    status: { type: String, enum: ['open', 'closed', 'full'], default: 'open' }
  },
  { timestamps: true }
);

courseSchema.index({ courseId: 1 }, { unique: true });

module.exports = mongoose.model('Course', courseSchema);