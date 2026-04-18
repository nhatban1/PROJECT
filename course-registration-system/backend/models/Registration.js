const mongoose = require("mongoose");
const { generateSequentialId } = require("../utils/sequentialId");

const registrationSchema = new mongoose.Schema(
  {
    _id: { type: String, trim: true },
    studentId: { type: String, ref: "User", required: true },
    courseId: { type: String, ref: "Course", required: true },
    semesterId: { type: String, ref: "Semester", required: true },
    status: { type: String, enum: ["registered", "cancelled"], default: "registered" },
    cancelledAt: Date,
    cancelReason: String
  },
  { timestamps: true }
);

registrationSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

registrationSchema.pre("validate", async function (next) {
  if (!this.isNew) return next();

  if (!this._id) {
    this._id = await generateSequentialId(this.constructor, "DK");
  }

  next();
});

module.exports = mongoose.model("Registration", registrationSchema);