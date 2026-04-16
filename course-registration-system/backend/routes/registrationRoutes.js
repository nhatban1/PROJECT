const express = require('express');
const registrationController = require('../controllers/registrationController');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/', authMiddleware, registrationController.registerCourse);
router.delete('/:id', authMiddleware, registrationController.cancelRegistration);
router.get('/', authMiddleware, authorizeRoles('admin'), registrationController.getRegistrations);

module.exports = router;
