var express = require("express");
var router = express.Router();
const db = require("../../lib/db");
const bcrypt = require("bcrypt");
const {
  fetchAllUsers,
  fetchSingleUser,
  insertUser,
  updateUser
} = require("../services/southernUsersApi.service");
const { v4: uuidv4 } = require('uuid');


const { isSouthOrNorth } =  require("../utils/geoLocation");


// Middleware to parse JSON bodies
router.use(express.json());
router.use(express.urlencoded({ extended: true }));


/* GET home page. */
router.get("/", async function (req, res) {
  res.send("Hello world!");
});

//Get all users
router.get("/users", LoggingMiddleware, async function (req, res) {
  try {
    const [northernUsersP, southernUsersP] = await Promise.allSettled([
      (async () => {
        const dbClient = await db.getClient();
        const users = await dbClient.all("SELECT * FROM user");
        await dbClient.close();
        return users;
      })(),
      fetchAllUsers(),
    ]);

    const allUsers = [
      ...(northernUsersP.value || []),
      ...(southernUsersP.value || []),
    ].sort((a, b) => a.id - b.id);

    // Header to indicate the total count
    res.set("X-Total-Count", allUsers.length).status(200).json(allUsers);
  } catch (e) {
    res
      .status(500)
      .json({ error: "Internal server error", details: e.message });
  }
});

//Get a singel user
router.get("/users/:id", LoggingMiddleware, async function (req, res) {
  const { id } = req.params;
  try {
    const user = await Promise.any([
      (async () => {
        const dbClient = await db.getClient();
        const userFound = await dbClient.get(
          "SELECT id, username, email, latitude, longitude, browser_language FROM user WHERE id = ?",
          [id]
        );
        await dbClient.close();
        return userFound;
      })(),
      fetchSingleUser(id),
    ]);

    if (!user) {
      res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (e) {
    res
      .status(500)
      .json({ error: "Internal server error", details: e.message });
  }
});

// Create an user
router.post("/users", LoggingMiddleware, async function (req, res) {
  const {
    body: { username, email, password, latitude, longitude, browser_language },
  } = req;

  if (!username || !email || !password || !latitude || !longitude) {
    return res.status(400).json({
      message:
        "Bad request, one or more of the following fields are missing: username, email, password, latitude, longitude",
    });
  }

  try {
    // Checking if coordinates are valid
    const hemisphere = await isSouthOrNorth(latitude, longitude);

    // Hashing password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Creating UUID
    const newId = uuidv4();
    
    let result;

    // Northerm user
    if (hemisphere === 'N') {
      const dbClient = await db.getClient();
      result = await dbClient.run(
        `INSERT INTO user (id, username, email, password, latitude, longitude, browser_language)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [newId, username, email, hashedPassword, latitude, longitude, browser_language]
      );
      await dbClient.close();
    }else {
      //Southerm user
      result = await insertUser({id, username, email, hashedPassword, latitude, longitude, browser_language});
    }

    res.status(201).json({
      id: result.lastID || result.id,
      username,
      email,
      message:  latitude > 0 ? "Northerm user created successfully" : "Southerm user created successfully",
    });
  } catch (e) {
    if (e.message.includes("UNIQUE constraint failed")) {
      res.status(409).json({ error: "Username or email already exists" });
    } else if (e.message.includes('Bad values')) {
      res.status(400).json({ error: "Coordinates are invalid"});
    }else {
      res.status(500).json({ error: "Internal server error", details: e.message });
    }
  }
});

// Update a user by ID
router.put("/users/:id", LoggingMiddleware, async (req, res) => {
  const {
    params: { id },
    body,
  } = req;

  try {
    let isNorthermUser;
    const user = await Promise.any([
      (async () => {
        const dbClient = await db.getClient();
        const userFound = await dbClient.get(
          "SELECT id, username, email, latitude, longitude, browser_language FROM user WHERE id = ?",
          [id]
        );
        await dbClient.close();
        return { user: userFound, isNorthermUser: true };;
      })(),
      (async () =>  {
       const userFound = await fetchSingleUser(id);
        return { user: userFound, isNorthermUser: false };
      })(),
    ]);

    if (!user) {
      res.status(404).json({ message: "User not found" });
    }

    const updates = {};
  
    for (const [key, value] of Object.entries(body)) {
      if (value !== undefined) {
        updates[key] =
          key === "password" ? await bcrypt.hash(value, 10) : value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json({ error: "No valid fields provided for update" });
    }

    // Check new coordinates if any 
    const newLat = updates.latitude ?? user.latitude;
    const newLong = updates.longitude ?? user.longitude;
    const newHemisphere = await isSouthOrNorth(newLat, newLong);
    const isNowNortherm = newHemisphere === "N";
    
    // Verifying if hemisfere changed

    if (isNowNortherm !== isNorthermUser) {

      if(isNowNortherm) {
        // Migrate from DB → API
        // TODO

      }

      const dbClient = await db.getClient();
      const setClause = Object.keys(updates)
        .map((key) => `${key} = ?`)
        .join(", ");
      const values = Object.values(updates).concat(id);
      await dbClient.run(
        `UPDATE user SET ${setClause} WHERE id = ?`,
        values
      );
      await dbClient.close();
    } else if (isNorthermUser === false) {
      await updateUser(id, updates);
    }

    res.json({ message: "User updated successfully" });
  } catch (e) {
    if (e.message.includes("UNIQUE constraint failed")) {
      res.status(409).json({ error: "Username or email already exists" });
    } else {
      res
        .status(500)
        .json({ error: "Internal server error", details: e.message });
    }
  }
});

// Delete a user by ID
router.delete("/users/:id", LoggingMiddleware, async (req, res) => {
  const {
    params: { id },
  } = req;
  try {
    const dbClient = await db.getClient();
    const result = await dbClient.run("DELETE FROM user WHERE id = ?", [id]);

    await dbClient.close();

    if (result.changes === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  } catch (e) {
    res
      .status(500)
      .json({ error: "Internal server error", details: e.message });
  }
});



module.exports = router;
