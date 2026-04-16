const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");
const paginationMiddleware = require("../middleware/paginationMiddleware");
const semesterController = require("../controllers/semesterController");

const router = express.Router();

router.get("/", authMiddleware, paginationMiddleware, semesterController.getSemesters);
router.get("/active", authMiddleware, semesterController.getActiveSemester);
router.get("/:id", authMiddleware, semesterController.getSemester);
router.post("/", authMiddleware, authorizeRoles("admin"), semesterController.createSemester);
router.put("/:id", authMiddleware, authorizeRoles("admin"), semesterController.updateSemester);
router.delete("/:id", authMiddleware, authorizeRoles("admin"), semesterController.deleteSemester);

module.exports = router;
