const express = require("express");
const router = express.Router();
const db = require("../db");
const jwt = require("jsonwebtoken");

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

// POST /api/ratings/submit
router.post("/submit", authMiddleware, async (req, res) => {
  const { storeId, rating } = req.body;
  if (!storeId || !rating || rating < 1 || rating > 5) return res.status(400).send("Invalid rating");

  try {
    await db.execute(
      `INSERT INTO ratings (store_id, user_id, rating_value) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE rating_value = ?`,
      [storeId, req.user.id, rating, rating]
    );
    res.send("Rating submitted");
  } catch (err) {
    res.status(500).send("Failed to submit rating");
  }
});

module.exports = router;
