const express = require('express');
const courseController = require('../controllers/courseController');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const paginationMiddleware = require('../middleware/paginationMiddleware');

const router = express.Router();

router.get('/', authMiddleware, paginationMiddleware, courseController.getCourses);
router.get('/:id', authMiddleware, courseController.getCourse);
router.post('/', authMiddleware, authorizeRoles('admin'), courseController.createCourse);
router.put('/:id', authMiddleware, authorizeRoles('admin'), courseController.updateCourse);
router.delete('/:id', authMiddleware, authorizeRoles('admin'), courseController.deleteCourse);

module.exports = router;
