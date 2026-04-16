const mongoose = require("mongoose");

const semesterSchema = new mongoose.Schema(
  {
    semesterId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    startDate: Date,
    endDate: Date,
    registrationStart: Date,
    registrationEnd: Date,
    maxCredits: { type: Number, default: 24 },
    status: { type: String, enum: ['planned','registration','closed'], default: 'planned' }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Semester", semesterSchema);