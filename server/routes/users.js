const express = require("express");
const connection = require("../config/dbConnection");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const multer = require("multer");
const path = require("path");
const { authorizeRoles } = require("../middleware/roleMiddleware.js");
dotenv.config();

const router = express.Router();
router.use(express.json());

const salt = 10;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/avatars"); // Directory to store uploaded avatars
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only .jpeg, .jpg, and .png files are allowed"));
    }
  },
});

//get all users
router.get("/", authorizeRoles(["admin"]), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const [countResult] = await connection.query(
      "SELECT COUNT(*) as total FROM users"
    );
    const total = countResult[0].total;

    const [result] = await connection.query(
      "SELECT * FROM users LIMIT ? OFFSET ?",
      [parseInt(limit), offset]
    );

    res.status(200).json({
      data: result,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Error getting users:", err);
    res.status(500).json({ error: "Error getting users" });
  }
});

//get all officers
router.get("/officers", async (req, res) => {
  try {
    const [officers] = await connection.query(
      "SELECT * FROM users WHERE role = 'officer'"
    );
    const count = officers.length;

    res.status(200).json({
      count,
      data: officers,
    });
  } catch (err) {
    console.error("Error getting officers:", err);
    res.status(500).json({ error: "Failed to retrieve officers" });
  }
});

//get a user
router.get("/:id", async (req, res) => {
  try {
    const [result] = await connection.query(
      "SELECT * FROM users WHERE id = ?",
      [req.params.id]
    );
    res.status(200).json(result);
  } catch (err) {
    console.error("Error getting user:", err);
    res.status(500).json({ error: "Error getting user" });
  }
});

//update a user
router.put("/:id", async (req, res) => {
  try {
    const [result] = await connection.query("UPDATE users SET ? WHERE id = ?", [
      req.body,
      req.params.id,
    ]);
    res
      .status(200)
      .json({ message: "User updated successfully", Status: "Success" });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: "Error updating user" });
  }
});

//delete a user
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await connection.query("DELETE FROM users WHERE id = ?", [
      req.params.id,
    ]);
    res
      .status(200)
      .json({ message: "User deleted successfully", Status: "Success" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: "Error deleting user" });
  }
});

//register a user
router.post(
  "/register",
  authorizeRoles(["admin"]),
  upload.single("avatar"),
  async (req, res) => {
    try {
      const url = "http://localhost:8000";
      const hash = await bcrypt.hash(req.body.password, salt);
      const avatarPath = req.file
        ? `${url}/uploads/avatars/${req.file.filename}`
        : null;

      const values = [
        req.body.firstName,
        req.body.lastName,
        req.body.email,
        hash,
        req.body.role.toLowerCase(),
        1, // is_active is set to 1 by default
        avatarPath,
      ];

      const sql =
        "INSERT INTO users (first_name, last_name, email, password, role, is_active, avatar) VALUES (?)";
      const [result] = await connection.query(sql, [values]);

      res.status(200).json({
        message: "User registered successfully",
        Status: "Success",
        avatar: avatarPath,
      });
    } catch (err) {
      console.error("Error registering user:", err);
      res.status(500).json({ error: "Error registering user" });
    }
  }
);

//login a user
router.post("/login", async (req, res) => {
  try {
    const [result] = await connection.query(
      "SELECT * FROM users WHERE email = ?",
      [req.body.email]
    );

    if (result.length > 0) {
      if (!result[0].is_active) {
        return res.status(403).json({ error: "User account is inactive" });
      }

      const isMatch = await bcrypt.compare(
        req.body.password,
        result[0].password
      );

      if (isMatch) {
        const name = result[0].first_name + " " + result[0].last_name;
        const email = result[0].email;
        const id = result[0].id;
        const role = result[0].role;

        // Update last_login field with current timestamp
        await connection.query(
          "UPDATE users SET last_login = NOW() WHERE id = ?",
          [id]
        );

        const token = jwt.sign({ id, role }, process.env.JWT_SECRET, {
          expiresIn: "1h",
        });

        res.status(200).json({ token, role, name, email, id });
      } else {
        res.status(401).json({ error: "Invalid email or password" });
      }
    } else {
      res.status(401).json({ error: "Invalid email or password" });
    }
  } catch (err) {
    console.error("Error logging in user:", err);
    res.status(500).json({ error: "Error logging in user" });
  }
});

module.exports = router;
