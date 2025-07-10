const express = require("express");
const router = express.Router();
const db = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

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

// ✅ ADMIN DASHBOARD
router.get("/admin/dashboard", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).send("Not authorized");

  const {
    userName,
    userEmail,
    userRole,
    userAddress,
    storeName,
    storeAddress,
    ownerEmail,
    userSortBy = "name",
    userOrder = "asc",
    storeSortBy = "s.name",
    storeOrder = "asc",
  } = req.query;

  try {
    const [[{ totalUsers }]] = await db.execute(`SELECT COUNT(*) AS totalUsers FROM users`);
    const [[{ totalStores }]] = await db.execute(`SELECT COUNT(*) AS totalStores FROM stores`);
    const [[{ totalRatings }]] = await db.execute(`SELECT COUNT(*) AS totalRatings FROM ratings`);

    // Users
    let userFilter = `WHERE 1=1`;
    let userParams = [];
    if (userName) {
      userFilter += " AND u.name LIKE ?";
      userParams.push(`%${userName}%`);
    }
    if (userEmail) {
      userFilter += " AND u.email LIKE ?";
      userParams.push(`%${userEmail}%`);
    }
   
    if (userRole) {
      userFilter += " AND u.role = ?";
      userParams.push(userRole);
    }
    if (userAddress) {
      userFilter += " AND u.address LIKE ?";
      userParams.push(`%${userAddress}%`);
    }

    const allowedUserSort = ["name", "email", "role", "address"];
    const userSort = allowedUserSort.includes(userSortBy) ? userSortBy : "name";
    const userSortDirection = userOrder.toLowerCase() === "desc" ? "DESC" : "ASC";

    const [users] = await db.execute(
      `SELECT 
         u.id, 
         u.name, 
         u.email, 
         u.address, 
         u.role,
         ROUND(AVG(r.rating_value), 1) AS avgRating
       FROM users u
       LEFT JOIN stores s ON u.id = s.owner_id
       LEFT JOIN ratings r ON s.id = r.store_id
       ${userFilter}
       GROUP BY u.id
       ORDER BY ${userSort} ${userSortDirection}`,
      userParams
    );

    // Stores
    let storeFilter = `WHERE 1=1`;
    let storeParams = [];
    if (storeName) {
      storeFilter += " AND s.name LIKE ?";
      storeParams.push(`%${storeName}%`);
    }
    if (storeAddress) {
      storeFilter += " AND s.address LIKE ?";
      storeParams.push(`%${storeAddress}%`);
    }
    if (ownerEmail) {
      storeFilter += " AND u.email LIKE ?";
      storeParams.push(`%${ownerEmail}%`);
    }

    const allowedStoreSort = ["s.name", "s.address", "avgRating", "u.email"];
    const storeSort = allowedStoreSort.includes(storeSortBy) ? storeSortBy : "s.name";
    const storeSortDirection = storeOrder.toLowerCase() === "desc" ? "DESC" : "ASC";

    const [stores] = await db.execute(
      `SELECT s.*, u.email AS owner_email, ROUND(AVG(r.rating_value),1) AS avgRating
       FROM stores s
       LEFT JOIN users u ON s.owner_id = u.id
       LEFT JOIN ratings r ON s.id = r.store_id
       ${storeFilter}
       GROUP BY s.id
       ORDER BY ${storeSort} ${storeSortDirection}`,
      storeParams
    );

    res.json({
      stats: {
        users: totalUsers,
        stores: totalStores,
        ratings: totalRatings,
      },
      users,
      stores,
    });
  } catch (err) {
    console.error("Error in /admin/dashboard:", err);
    res.status(500).send("Error loading admin dashboard");
  }
});
  

// ✅ PASSWORD UPDATE
router.put("/update-password", authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!newPassword.match(/^(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,16}$/)) {
    return res.status(400).send("New password does not meet criteria");
  }

  try {
    const [rows] = await db.execute("SELECT password FROM users WHERE id = ?", [req.user.id]);
    if (rows.length === 0) return res.status(404).send("User not found");

    const valid = await bcrypt.compare(currentPassword, rows[0].password);
    if (!valid) return res.status(400).send("Current password is incorrect");

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.execute("UPDATE users SET password = ? WHERE id = ?", [hashed, req.user.id]);

    res.send("Password updated successfully");
  } catch (err) {
    console.error("Error updating password:", err);
    res.status(500).send("Server error");
  }
});

// ✅ OWNER DASHBOARD (Enhanced Sorting)
router.get("/owner", authMiddleware, async (req, res) => {
  if (req.user.role !== "owner") return res.status(403).send("Access denied");

  const { sortField = "userName", sortOrder = "asc" } = req.query;

  const allowedFields = ["userName", "email", "rating_value", "submittedAt"];
  const allowedOrders = ["asc", "desc"];

  const fieldMap = {
    userName: "u.name",
    email: "u.email",
    rating_value: "r.rating_value",
    submittedAt: "r.created_at"
  };

  const field = allowedFields.includes(sortField) ? fieldMap[sortField] : "u.name";
  const order = allowedOrders.includes(sortOrder.toLowerCase()) ? sortOrder.toUpperCase() : "ASC";

  try {
    // Get store owned by this user
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

    // Dynamically build query with validated field and order
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
       ORDER BY ${field} ${order}`,
      [store.id]
    );

    res.json({ store, ratings });
  } catch (err) {
    console.error("Error in /owner:", err);
    res.status(500).json({ error: "Failed to load store owner dashboard" });
  }
});



module.exports = router;
