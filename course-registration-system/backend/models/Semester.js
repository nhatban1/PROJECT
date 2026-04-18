const mongoose = require("mongoose");
const { generateSequentialId } = require("../utils/sequentialId");

const semesterSchema = new mongoose.Schema(
  {
    _id: { type: String, trim: true },
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

semesterSchema.pre("validate", async function (next) {
  if (!this.isNew) return next();

  if (!this._id) {
    this._id = await generateSequentialId(this.constructor, "HK");
  }

  if (!this.semesterId) {
    this.semesterId = this._id;
  }

  next();
});

module.exports = mongoose.model("Semester", semesterSchema);