// routes/userRoutes.js
const express = require("express");
const router  = express.Router();
const { getProfile, getDashboard, getSaved } = require("../controllers/userController");
const { protect } = require("../middleware/auth");

router.get("/dashboard",   protect, getDashboard);  // must be before /:id/profile
router.get("/saved",       protect, getSaved);
router.get("/:id/profile",          getProfile);

module.exports = router;
