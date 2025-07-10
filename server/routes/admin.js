const express = require("express");
const router = express.Router();
const db = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// Auth middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.sendStatus(401);
  try {
    req.user = jwt.verify(token, "mySecretKey");
    next();
  } catch {
    res.sendStatus(403);
  }
};



//  POST /api/admin/users
router.post("/users", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).send("Access denied");

  const { name, email, password, address, role } = req.body;
  if (!name || !email || !password || !address || !role) {
    return res.status(400).send("All fields required");
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    await db.execute(
      `INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)`,
      [name, email, hashed, address, role]
    );
    res.send("User created successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding user");
  }
});

router.post("/stores", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).send("Access denied");

  const { name, address, owner_id } = req.body;
  console.log("📥 Incoming store data:", { name, address, owner_id });

  if (!name || !address || !owner_id) {
    return res.status(400).send("All fields (name, address, owner_id) are required");
  }

  try {
    // Check if owner exists
    const [owner] = await db.execute(
      "SELECT id FROM users WHERE id = ? AND role = 'owner'",
      [owner_id]
    );

    if (owner.length === 0) {
      return res.status(400).send("Owner with this ID does not exist or is not a store owner");
    }

    //  Check for duplicate store name for same owner
    const [existing] = await db.execute(
      "SELECT id FROM stores WHERE name = ? AND owner_id = ?",
      [name, owner_id]
    );
    if (existing.length > 0) {
      return res.status(400).send("Store already exists for this owner");
    }

    //  Insert the store
    const [result] = await db.execute(
      "INSERT INTO stores (name, address, owner_id) VALUES (?, ?, ?)",
      [name, address, owner_id]
    );

    console.log(" Store inserted, ID:", result.insertId);

    res.send("Store added successfully");
  } catch (err) {
    console.error("❌ Error inserting store:", err);
    res.status(500).send("Error adding store");
  }
});



module.exports = router;
