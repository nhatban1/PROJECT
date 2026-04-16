const Notification = require("../models/Notification");

exports.getNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({
      $or: [
        { targetRole: "all" },
        { targetRole: req.user.role },
        { targetUsers: userId }
      ]
    }).sort({ createdAt: -1 });
    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({
      $or: [
        { targetRole: "all" },
        { targetRole: req.user.role },
        { targetUsers: userId }
      ]
    });
    const unreadCount = notifications.filter((notification) =>
      !notification.isRead.some((item) => String(item.userId) === String(userId))
    ).length;
    res.json({ success: true, data: unreadCount });
  } catch (error) {
    next(error);
  }
};

exports.createNotification = async (req, res, next) => {
  try {
    const payload = { ...req.body, createdBy: req.user._id };
    const notification = await Notification.create(payload);
    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ success: false, message: "Không tìm thấy thông báo" });
    const userId = req.user._id;
    if (!notification.isRead.some((item) => String(item.userId) === String(userId))) {
      notification.isRead.push({ userId, readAt: new Date() });
      await notification.save();
    }
    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

exports.readAll = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({
      $or: [
        { targetRole: "all" },
        { targetRole: req.user.role },
        { targetUsers: userId }
      ]
    });
    for (const notification of notifications) {
      if (!notification.isRead.some((item) => String(item.userId) === String(userId))) {
        notification.isRead.push({ userId, readAt: new Date() });
        await notification.save();
      }
    }
    res.json({ success: true, data: notifications.length });
  } catch (error) {
    next(error);
  }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) return res.status(404).json({ success: false, message: "Không tìm thấy thông báo" });
    res.json({ success: true, message: "Đã xóa thông báo" });
  } catch (error) {
    next(error);
  }
};