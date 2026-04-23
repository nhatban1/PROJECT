const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const paginationMiddleware = require('../middleware/paginationMiddleware');
const studentController = require('../controllers/studentController');

const router = express.Router();

router.get('/', authMiddleware, authorizeRoles('admin'), paginationMiddleware, studentController.getStudents);
router.get('/:id', authMiddleware, authorizeRoles('admin'), studentController.getStudent);
router.post('/', authMiddleware, authorizeRoles('admin'), studentController.createStudent);
router.put('/:id', authMiddleware, authorizeRoles('admin'), studentController.updateStudent);
router.delete('/:id', authMiddleware, authorizeRoles('admin'), studentController.deleteStudent);

module.exports = router;