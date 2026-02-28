// routes/aiRoutes.js
const express  = require("express");
const { body } = require("express-validator");
const router   = express.Router();
const { generate }  = require("../controllers/aiController");
const { protect }   = require("../middleware/auth");
const { validate }  = require("../middleware/validate");

// POST /api/ai/generate  — requires login
router.post(
  "/generate",
  [
    protect,
    body("tool").notEmpty().withMessage("tool is required"),
    body("inputs").isObject().withMessage("inputs must be an object"),
    validate,
  ],
  generate
);

module.exports = router;
