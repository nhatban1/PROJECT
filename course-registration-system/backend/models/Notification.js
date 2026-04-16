const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: String,
    message: String,
    targetRole: { type: String, enum: ['all','student','admin','teacher'], default: 'all' },
    targetUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isRead: [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, readAt: Date }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);