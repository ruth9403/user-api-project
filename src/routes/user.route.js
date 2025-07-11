import express from 'express';
import { UserController } from '../controllers/user.controller.js';
import { LoggingMiddleware } from '../middlewares/logging.middleware.js';

export class UserRouter {
    router;
    userController;

  constructor() {
    console.log('Initializing UserRouter...');
    this.router = express.Router();
    this.userController = new UserController();
    this.initializeRoutes();
  }

  initializeRoutes() {
    this.router.get('/', LoggingMiddleware, async (req, res, next) => await this.userController.getAllUsers(req, res, next));
    this.router.get('/:id', LoggingMiddleware, async (req, res, next) => await this.userController.getUserById(req, res, next));
    this.router.post('/', LoggingMiddleware, async (req, res, next) => await this.userController.createUser(req, res, next));
    this.router.put('/:id', LoggingMiddleware, async (req, res, next) => await this.userController.updateUser(req, res, next));
    this.router.delete('/:id', LoggingMiddleware, async (req, res, next) => await this.userController.deleteUser(req, res, next));
  }

  getRouter() {
    return this.router;
  }
}
