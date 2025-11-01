// routes/salaryRoutes.js
const express = require("express");
const {
  getAllSalaries,
  updateSalary,
  getMySalary,
} = require("../controllers/salaryController");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

// Admin
router.get("/", auth(["admin"]), getAllSalaries);
router.put("/:id", auth(["admin"]), updateSalary);

// User
router.get("/me", auth(["admin", "manager", "employee"]), getMySalary);

module.exports = router;
