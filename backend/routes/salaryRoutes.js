const express = require("express");
const { getAllSalaries, updateSalary, getMySalary } = require("../controllers/salaryController");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

// GIỮ path cũ — web dùng tiếp; mobile dùng /api/salary/* (alias)
router.get("/", auth(["admin"]), getAllSalaries);
router.put("/:id", auth(["admin"]), updateSalary);

// User xem lương của mình
router.get("/me", auth(["employee", "manager", "admin"]), getMySalary);

module.exports = router;
