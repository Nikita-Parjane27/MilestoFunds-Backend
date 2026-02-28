// routes/paymentRoutes.js  — Razorpay
const express = require("express");
const router  = express.Router();
const {
  createOrder,
  verifyPayment,
  getContribution,
  getMyContributions,
} = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");

// Create Razorpay order (returns orderId + keyId to frontend)
router.post("/create-order",  protect, createOrder);

// Verify signature after payment popup success
router.post("/verify",        protect, verifyPayment);

// Get single contribution for success page
router.get("/contribution/:paymentId", protect, getContribution);

// Get all contributions for logged-in user
router.get("/my-contributions", protect, getMyContributions);

module.exports = router;
