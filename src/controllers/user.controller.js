import { v4 as uuidv4 } from 'uuid';
import bcrypt from "bcrypt";

import { UserService } from "../services/user.service.js";
import { AppError } from "../utils/error.js";
import { DbStorageStrategy } from "../services/userStrategies/dbStorageStrategy.js";
import { ApiStorageStrategy } from "../services/userStrategies/apiStorageStrategy.js";

import { HEMISPHERE_NORTH, HEMISPHERE_SOUTH } from "../config/constants.js";

export class UserController {
  userService;

  constructor() {
    const strategies = {
      [HEMISPHERE_NORTH]: new DbStorageStrategy(),
      [HEMISPHERE_SOUTH]: new ApiStorageStrategy(),
    };
    this.userService = new UserService(strategies);
  }
  
  async helloWorld(req, res) {
    res.send("Hello world!");
  }

  async getAllUsers(req, res, next) {
    try {
      const users = await this.userService.getAllUsers();
      // Header to indicate the total count
      res.set("X-Total-Count", users.length).json(users);
    } catch (e) {
      next(e);
    }
  }

  async getUserById(req, res, next) {
    try {
      const user = await this.userService.getUserById(req.params.id);
      if (!user) return next(new AppError("User not found", 404));
      res.json(user);
    } catch (e) {
      next(e);
    }
  }

  async createUser(req, res, next) {
    try {
      const {
        body: {
          username,
          email,
          password,
          latitude,
          longitude,
          browser_language,
        },
      } = req;

      // Validating required fields
      if (!username || !email || !password || !latitude || !longitude) {
        return next(
          new AppError(
            "Bad request, one or more of the following fields are missing: username, email, password, latitude, longitude",
            400
          )
        );
      }

      // Hashing password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Creating UUID
      const id = uuidv4();
      const userData = {
        id,
        username,
        email,
        password: hashedPassword,
        latitude,
        longitude,
        browser_language,
      };

      // Get the appropriate strategy based on hemisphere
      const strategy = await this.userService.getStorageStrategy(latitude, longitude);
      await strategy.createUser(userData);
      res.status(201).json({ id, username, email });
    } catch (e) {
      if (e.message.includes("UNIQUE constraint failed")) {
        return next(new AppError("Username or email already exists", 409));
      }
      next(e);
    }

      
  }

  async updateUser(req, res, next) {
    try {
      const {
        params: { id },
        body,
      } = req;

      // Searching for user
      const { user, source } = await this.userService.searchForUser(id);

      if (!user) return next(new AppError("User not found", 404));

      // Hashing new password if any
      const preparedUpdates = { ...body };
      if (preparedUpdates.password) {
        preparedUpdates.password = await bcrypt.hash(
          preparedUpdates.password,
          10
        );
      }

      // Check if hemisphere changed
      const newLat = preparedUpdates.latitude ?? user.latitude;
      const newLong = preparedUpdates.longitude ?? user.longitude;
      const newStrategy = await this.userService.getStorageStrategy(newLat, newLong);
      const newHemisphere = Object.keys(this.userService.strategies).find(
        (key) => this.userService.strategies[key] === newStrategy
      );

      const result = await this.userService.updateUser(id, preparedUpdates, source, newHemisphere);
      res.json(result);
    } catch (e) {
      if (e.message.includes("UNIQUE constraint failed")) {
        return next(new AppError("Username or email already exists", 409));
      }

      next(e);
    }
  }

  async deleteUser(req, res, next) {
    try {
      // Searching for user
      const { user, source } = await this.userService.searchForUser(req.params.id);
      if (!user) return next(new AppError("User not found", 404));
      await this.userService.deleteUser(req.params.id, source);
      res.json({ id: req.params.id, message: "User deleted successfully" });
    } catch (e) {
      next(e);
    }
  }
}
