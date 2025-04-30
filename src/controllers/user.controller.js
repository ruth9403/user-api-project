const userService = require("../services/user.service");
const { v4: uuidv4 } = require("uuid");
const { isSouthOrNorth } = require("../utils/geoLocation");
const bcrypt = require("bcrypt");
const { AppError } = require('../utils/error')

module.exports = {
  helloWorld: (req, res) => res.send("Hello world!"),

  getAllUsers: async (req, res, next) => {
    try {
      const users = await userService.getAllUsers();
      // Header to indicate the total count
      res.set("X-Total-Count", users.length).json(users);
    } catch (e) {
      next(e);
    }
  },

  getUserById: async (req, res, next) => {
    try {
      const user = await userService.getUserById(req.params.id);
      if (!user) return next(new AppError('User not found', 404));
      res.json(user);
    } catch (e) {
      next(e);
    }
  },

  createUser: async (req, res, next) => {
    try {
      const {
        body: {
          username,
          email,
          password,
          latitude,
          longitude,
          browser_language,
        }
      } = req;

      // Validating required fields
      if (!username || !email || !password || !latitude || !longitude) {
        return next(new AppError('Bad request, one or more of the following fields are missing: username, email, password, latitude, longitude', 400))
      }

      // Checking if coordinates are valid
      const hemisphere = await isSouthOrNorth(latitude, longitude);

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
      await userService.createUser(userData, hemisphere);
      res.status(201).json({id, username, email});
    } catch (e) {
      if (e.message.includes("UNIQUE constraint failed")) {
        return next(new AppError("Username or email already exists", 409));
      }

      next(e);
    }
  },

  updateUser: async (req, res, next) => {
    try {
      const {
        params: { id },
        body,
      } = req;

      // Searching for user
      const { user, source } = await userService.searchForUser(id);

      if (!user) return next(new AppError('User not found', 404));
      
      // Hashing new password if any
      const preparedUpdates = { ...body };
      if (preparedUpdates.password) {
        preparedUpdates.password = await bcrypt.hash(preparedUpdates.password, 10);
      }

      // Check if hemisphere changed
      const newLat = preparedUpdates.latitude ?? user.latitude;
      const newLong = preparedUpdates.longitude ?? user.longitude;
      const newHemisphere = await isSouthOrNorth(newLat, newLong);

      const result = await userService.updateUser(id, preparedUpdates, source, newHemisphere);
      res.json(result);
    } catch (e) {
      if (e.message.includes("UNIQUE constraint failed")) {
        return next(new AppError("Username or email already exists", 409));
      }

      next(e)
    }
  },

  deleteUser: async (req, res, next) => {
    try {
      // Searching for user
      const { user, source } = await userService.searchForUser(req.params.id);
      if (!user) return next(new AppError('User not found', 404));
      await userService.deleteUser(req.params.id, source);
      res.json({ id: req.params.id, message: "User deleted successfully" });
    } catch (e) {
      next(e);
    }
  },
};
