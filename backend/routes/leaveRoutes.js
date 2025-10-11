const express = require("express");
const { createLeave, getMyLeaves } = require("../controllers/leaveController");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", auth(["employee", "manager"]), createLeave);
router.get("/me", auth(["employee", "manager"]), getMyLeaves);

module.exports = router;
