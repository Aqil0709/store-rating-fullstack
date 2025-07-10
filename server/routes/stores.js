const express = require("express");
const router = express.Router();
const db = require("../db");
const jwt = require("jsonwebtoken");

// ✅ Auth Middleware
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

// ✅ Admin adds a store with owner email lookup
// ✅ FIXED route
router.post("/stores", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).send("Access denied");

  const { name, address, owner_id } = req.body;
  console.log("📥 Incoming store data:", { name, address, owner_id });

  if (!name || !address || !owner_id) {
    return res.status(400).send("All fields are required");
  }

  try {
    // ✅ Validate owner exists
    const [owner] = await db.execute(
      "SELECT id FROM users WHERE id = ? AND role = 'owner'",
      [owner_id]
    );
    if (owner.length === 0) {
      return res.status(400).send("Owner not found");
    }

    // ✅ Prevent duplicate
    const [existing] = await db.execute(
      "SELECT id FROM stores WHERE name = ? AND owner_id = ?",
      [name, owner_id]
    );
    if (existing.length > 0) {
      return res.status(400).send("Store already exists for this owner");
    }

    // ✅ Correct insertion + destructuring
    const [result] = await db.execute(
      "INSERT INTO stores (name, address, owner_id) VALUES (?, ?, ?)",
      [name, address, owner_id]
    );

    res.send("Store added successfully");
  } catch (err) {
    console.error("❌ Error inserting store:", err);
    res.status(500).send("Internal server error");
  }
});




// ✅ GET /stores/all (user can browse & rate)
router.get("/all", authMiddleware, async (req, res) => {
  try {
    const { name, address, sortBy = "s.name", order = "asc" } = req.query;

    const allowedSortFields = ["s.name", "avgRating", "s.created_at"];
    const allowedOrder = ["asc", "desc"];

    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "s.name";
    const sortOrder = allowedOrder.includes(order.toLowerCase()) ? order.toUpperCase() : "ASC";

    let whereClause = "";
    let params = [];

    if (name) {
      whereClause += ` AND s.name LIKE ?`;
      params.push(`%${name}%`);
    }

    if (address) {
      whereClause += ` AND s.address LIKE ?`;
      params.push(`%${address}%`);
    }

    const [stores] = await db.execute(
      `SELECT s.*, u.email AS owner_email, ROUND(AVG(r.rating_value), 1) AS avgRating
       FROM stores s
       LEFT JOIN ratings r ON s.id = r.store_id
       LEFT JOIN users u ON s.owner_id = u.id
       WHERE 1=1 ${whereClause}
       GROUP BY s.id
       ORDER BY ${sortField} ${sortOrder}`,
      params
    );

    let myRatings = {};
    if (req.user.role === "user") {
      const [ratings] = await db.execute(
        `SELECT store_id, rating_value FROM ratings WHERE user_id = ?`,
        [req.user.id]
      );
      ratings.forEach((r) => {
        myRatings[r.store_id] = r.rating_value;
      });
    }

    res.json({ stores, myRatings });
  } catch (err) {
    console.error("Error in /stores/all:", err);
    res.status(500).json({ error: "Error fetching stores" });
  }
});

// ✅ GET /stores/owner (dashboard for store owner)
router.get("/owner", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).send("No token provided");

    let decoded;
    try {
      decoded = jwt.verify(token, "mySecretKey");
    } catch (err) {
      return res.status(403).send("Invalid token");
    }

    if (decoded.role !== "owner") return res.status(403).send("Access denied");

    const userId = decoded.id;
    const { sortField = "userName", sortOrder = "asc" } = req.query;

    const allowedFields = {
      userName: "u.name",
      email: "u.email",
      rating_value: "r.rating_value",
      submittedAt: "r.created_at",
      createdAt: "u.created_at",
    };

    const orderBy = allowedFields[sortField] || "u.name";
    const order = ["asc", "desc"].includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : "ASC";

    // Get store of the owner
    const [stores] = await db.execute(
      `SELECT s.*, ROUND(AVG(r.rating_value), 1) AS avgRating
       FROM stores s
       LEFT JOIN ratings r ON s.id = r.store_id
       WHERE s.owner_id = ?
       GROUP BY s.id`,
      [userId]
    );

    if (stores.length === 0) return res.status(404).send("Store not found");
    const store = stores[0];

    // Get ratings for that store
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
