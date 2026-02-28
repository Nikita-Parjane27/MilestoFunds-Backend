// server.js — CrowdFund Platform Entry Point

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  morgan(process.env.NODE_ENV === "production" ? "combined" : "dev")
);

// ── Routes ─────────────────────────────────────────────────────────────
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));

// ── Health Check ───────────────────────────────────────────────────────
app.get("/api/health", (_req, res) =>
  res.json({
    success: true,
    message: "MilestoFund API ✅",
    env: process.env.NODE_ENV,
    supabase: !!process.env.SUPABASE_URL,
    gemini: !!process.env.GEMINI_API_KEY,
    razorpay: !!process.env.RAZORPAY_KEY_ID,
  })
);

// ── Error Handling ─────────────────────────────────────────────────────
const { notFound, errorHandler } = require("./middleware/error");
app.use(notFound);
app.use(errorHandler);

// ── Server Start ───────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("");
  console.log("🚀 MilestoFund backend running on port " + PORT);
  console.log("📡 Health check available at /api/health");
  console.log("");

  if (!process.env.GEMINI_API_KEY) {
    console.warn("⚠️ GEMINI_API_KEY not set — AI tools may not work.");
  }

  if (!process.env.RAZORPAY_KEY_ID) {
    console.warn("⚠️ RAZORPAY_KEY_ID not set — Payments may not work.");
  }
});

module.exports = app;