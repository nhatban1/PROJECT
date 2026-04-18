const mongoose = require("mongoose");
const { generateSequentialId } = require("../utils/sequentialId");

const notificationSchema = new mongoose.Schema(
  {
    _id: { type: String, trim: true },
    title: String,
    message: String,
    targetRole: { type: String, enum: ['all','student','admin','teacher'], default: 'all' },
    targetUsers: [{ type: String, ref: 'User' }],
    createdBy: { type: String, ref: 'User' },
    isRead: [{ userId: { type: String, ref: 'User' }, readAt: Date }]
  },
  { timestamps: true }
);

notificationSchema.pre("validate", async function (next) {
  if (!this.isNew) return next();

  if (!this._id) {
    this._id = await generateSequentialId(this.constructor, "TB");
  }

  next();
});

module.exports = mongoose.model("Notification", notificationSchema);