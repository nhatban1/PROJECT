const mongoose = require("mongoose");
const { generateSequentialId } = require("../utils/sequentialId");

const teacherSchema = new mongoose.Schema(
  {
    _id: { type: String, trim: true },
    teacherId: { type: String, required: true, unique: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    department: { type: String, trim: true }
  },
  { timestamps: true }
);

teacherSchema.pre("validate", async function (next) {
  if (!this.isNew) return next();

  if (!this._id) {
    this._id = await generateSequentialId(this.constructor, "GV");
  }

  if (!this.teacherId) {
    this.teacherId = this._id;
  }

  next();
});

module.exports = mongoose.model("Teacher", teacherSchema);