const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const notificationController = require("../controllers/notificationController");

const router = express.Router();

router.get("/", authMiddleware, notificationController.getNotifications);
router.get("/unread-count", authMiddleware, notificationController.getUnreadCount);
router.post("/", authMiddleware, authorizeRoles("admin"), notificationController.createNotification);
router.put("/:id/read", authMiddleware, notificationController.markRead);
router.put("/read-all", authMiddleware, notificationController.readAll);
router.delete("/:id", authMiddleware, authorizeRoles("admin"), notificationController.deleteNotification);

module.exports = router;
