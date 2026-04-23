const mongoose = require("mongoose");
const { generateSequentialId } = require("../utils/sequentialId");

const studentSchema = new mongoose.Schema(
  {
    _id: { type: String, trim: true },
    studentId: { type: String, required: true, unique: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    phone: String,
    department: String,
    academicYear: String,
  },
  { timestamps: true }
);

studentSchema.pre("validate", async function (next) {
  if (!this.isNew) return next();

  if (!this._id) {
    this._id = await generateSequentialId(this.constructor, "SV");
  }

  if (!this.studentId) {
    this.studentId = this._id;
  }

  next();
});

module.exports = mongoose.model("Student", studentSchema);