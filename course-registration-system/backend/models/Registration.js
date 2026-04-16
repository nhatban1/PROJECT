const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    semesterId: { type: mongoose.Schema.Types.ObjectId, ref: "Semester", required: true },
    status: { type: String, enum: ["registered", "cancelled"], default: "registered" },
    cancelledAt: Date,
    cancelReason: String
  },
  { timestamps: true }
);

registrationSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model("Registration", registrationSchema);