const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema(
  {
  teacherId: { type: String, required: true, unique: true, trim: true },
  fullName: { type: String, required: true, trim: true },
  department: { type: String, trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Teacher", teacherSchema);