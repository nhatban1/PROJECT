const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const paginationMiddleware = require('../middleware/paginationMiddleware');

const router = express.Router();

router.get('/', authMiddleware, authorizeRoles('admin'), paginationMiddleware, userController.getUsers);
router.get('/:id', authMiddleware, authorizeRoles('admin'), userController.getUser);
router.post('/', authMiddleware, authorizeRoles('admin'), userController.createUser);
router.put('/:id', authMiddleware, authorizeRoles('admin'), userController.updateUser);
router.delete('/:id', authMiddleware, authorizeRoles('admin'), userController.deleteUser);

module.exports = router;
