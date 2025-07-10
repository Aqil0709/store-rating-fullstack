const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const SECRET = "mySecretKey";
// Define authMiddleware inline
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).send("No token provided");

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).send("Invalid or expired token");
  }
};
// Signup
router.post("/signup", async (req, res) => {
  const { name, email, address, password, role } = req.body;

  if (!name || name.length < 2 || name.length > 60) {
    return res.status(400).send("Invalid name");
  }

  if (!password.match(/^(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,16}$/)) {
    return res.status(400).send("Invalid password");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await db.execute(
      "INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)",
      [name, email, hashedPassword, address, role || "user"]
    );

    res.status(201).send("User registered");
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).send("Email already exists");
    }
    console.error("Signup error:", err);
    res.status(500).send("Server error");
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);

    if (rows.length === 0) return res.status(401).send("Invalid email or password");

    const valid = await bcrypt.compare(password, rows[0].password);
    if (!valid) return res.status(401).send("Invalid email or password");

    const token = jwt.sign({ id: rows[0].id, role: rows[0].role }, SECRET, { expiresIn: "1d" });

    res.json({
      token,
      user: { id: rows[0].id, name: rows[0].name, role: rows[0].role },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).send("Server error");
  }
});

// POST /auth/update-password
router.post("/update-password", authMiddleware, async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword.match(/^(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,16}$/)) {
    return res.status(400).send("Invalid password format");
  }
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await db.execute("UPDATE users SET password = ? WHERE id = ?", [
    hashedPassword,
    req.user.id,
  ]);
  res.send("Password updated");
});


// route: /api/stores/owner
router.get("/owner", authMiddleware, async (req, res) => {
  if (req.user.role !== "owner") return res.status(403).send("Access denied");

  const { sortField = "userName", sortOrder = "asc" } = req.query;

  const allowedFields = {
    userName: "u.name",
    email: "u.email",
    rating_value: "r.rating_value",
    submittedAt: "r.created_at",
    createdAt: "u.created_at", // Add support for sorting by createdAt if needed
  };

  const orderBy = allowedFields[sortField] || "u.name";
  const order = ["asc", "desc"].includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : "ASC";

  try {
    const [stores] = await db.execute(
      `SELECT s.*, ROUND(AVG(r.rating_value), 1) AS avgRating
       FROM stores s
       LEFT JOIN ratings r ON s.id = r.store_id
       WHERE s.owner_id = ?
       GROUP BY s.id`,
      [req.user.id]
    );

    if (stores.length === 0) return res.status(404).send("Store not found");
    const store = stores[0];

    const [ratings] = await db.execute(
      `SELECT 
         u.name AS userName, 
         u.email, 
         u.created_at AS createdAt,
         r.rating_value, 
         r.created_at AS submittedAt
       FROM ratings r
       JOIN users u ON r.user_id = u.id
       WHERE r.store_id = ?
       ORDER BY ${orderBy} ${order}`,
      [store.id]
    );

    res.json({ store, ratings });
  } catch (err) {
    console.error("Error in /stores/owner:", err);
    res.status(500).json({ error: "Failed to load store owner dashboard" });
  }
});


module.exports = router;
