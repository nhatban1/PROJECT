const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const paginationMiddleware = require("../middleware/paginationMiddleware");
const teacherController = require("../controllers/teacherController");

const router = express.Router();

router.get("/", authMiddleware, paginationMiddleware, teacherController.getTeachers);
router.get("/:id", authMiddleware, teacherController.getTeacher);
router.post("/", authMiddleware, authorizeRoles("admin"), teacherController.createTeacher);
router.put("/:id", authMiddleware, authorizeRoles("admin"), teacherController.updateTeacher);
router.delete("/:id", authMiddleware, authorizeRoles("admin"), teacherController.deleteTeacher);

module.exports = router;
