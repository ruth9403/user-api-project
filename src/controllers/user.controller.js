const userService = require("../services/user.service");
const { v4: uuidv4 } = require("uuid");
const { isSouthOrNorth } = require("../utils/geoLocation");
const bcrypt = require("bcrypt");

module.exports = {
  helloWorld: (req, res) => res.send("Hello world!"),

  getAllUsers: async (req, res) => {
    try {
      const users = await userService.getAllUsers();

      // Header to indicate the total count
      res.set("X-Total-Count", users.length).json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getUserById: async (req, res) => {
    try {
      const user = await userService.getUserById(req.params.id);
      user
        ? res.json(user)
        : res.status(404).json({ message: "User not found" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  createUser: async (req, res) => {
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
        return res.status(400).json({
          message:
            "Bad request, one or more of the following fields are missing: username, email, password, latitude, longitude",
        });
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
        res.status(409).json({ error: "Username or email already exists" });
      } else if (e.message.includes("Bad values")) {
        res.status(400).json({ error: "Coordinates are invalid" });
      } else {
        res
          .status(500)
          .json({ error: "Internal server error", details: e.message });
      }
    }
  },

  updateUser: async (req, res) => {
    try {
      const {
        params: { id },
        body,
      } = req;

      // Searching for user
      const { user, source } = await userService.searchForUser(id);

      if (!user) {
        res.status(404).json({ message: "User not found" });
      }
      
      // Hashing new password if any
      const preparedUpdates = { ...body };
      if (preparedUpdates.password) {
        preparedUpdates.password = await bcrypt.hash(preparedUpdates.password, 10);
      }

      // Check if hemisphere changed
      const newLat = preparedUpdates.latitude ?? user.latitude;
      const newLong = preparedUpdates.longitude ?? user.longitude;
      const newHemisphere = await isSouthOrNorth(newLat, newLong);

      const needsMigration =
      (source === "db" && newHemisphere === "S") ||
      (source === "api" && newHemisphere === "N");

      const result = await userService.updateUser(id, preparedUpdates, source, needsMigration);
      res.json(result);
    } catch (e) {
      if (e.message.includes("UNIQUE constraint failed")) {
        res.status(409).json({ error: "Username or email already exists" });
      } else {
        res
          .status(500)
          .json({ error: "Internal server error", details: e.message });
      }
    }
  },

  deleteUser: async (req, res) => {
    try {
      await userService.deleteUser(req.params.id);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};
