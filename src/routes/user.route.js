const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const LoggingMiddleware = require('../middlewares/logging.middleware');

// Routes
//router.get('/', userController.helloWorld);
router.get('/', LoggingMiddleware, userController.getAllUsers);
router.get('/:id', LoggingMiddleware, userController.getUserById);
router.post('/', LoggingMiddleware, userController.createUser);
router.put('/:id', LoggingMiddleware, userController.updateUser);
router.delete('/:id', LoggingMiddleware, userController.deleteUser);

module.exports = router;