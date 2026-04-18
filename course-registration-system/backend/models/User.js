const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { generateSequentialId } = require("../utils/sequentialId");

const userSchema = new mongoose.Schema(
  { 
    _id: { type: String, trim: true },
    userId: { type: String, trim: true },
    fullName: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: String,
    department: String,
    academicYear: String,
    role: { type: String, enum: ['student','admin','teacher'], default: 'student' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

userSchema.pre("validate", async function (next) {
  if (!this.isNew) return next();

  const role = this.role || "student";
  const prefix = role === "admin" ? "AD" : role === "teacher" ? "GV" : "SV";

  if (!this._id) {
    this._id = await generateSequentialId(this.constructor, prefix, { role });
  }

  if (!this.userId) {
    this.userId = this._id;
  }

  next();
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model("User", userSchema);