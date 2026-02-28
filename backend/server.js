// server.js — CrowdFund Platform Entry Point
require("dotenv").config();

// ── Check .env file exists and has values ─────────────────────────────
const fs = require("fs");
const path = require("path");
const envPath = path.join(__dirname, ".env");

if (!fs.existsSync(envPath)) {
  console.error("");
  console.error("❌  ERROR: .env file not found!");
  console.error("   → Copy .env.example to .env:");
  console.error("   → Windows: copy .env.example .env");
  console.error("   → Then fill in your Supabase, Razorpay and Gemini keys.");
  console.error("");
  process.exit(1);
}

const express = require("express");
const cors    = require("cors");
const morgan  = require("morgan");

const app = express();

app.use(cors({
  origin:         process.env.CLIENT_URL || "http://localhost:5173",
  credentials:    true,
  methods:        ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ── Routes ────────────────────────────────────────────────────────────
app.use("/api/auth",     require("./routes/authRoutes"));
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/users",    require("./routes/userRoutes"));
app.use("/api/ai",       require("./routes/aiRoutes"));

// ── Health check ──────────────────────────────────────────────────────
app.get("/api/health", (_req, res) =>
  res.json({
    success: true,
    message: "CrowdFund API ✅",
    env: process.env.NODE_ENV,
    supabase: !!process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes("your-project"),
    gemini:   !!process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes("your_"),
    razorpay: !!process.env.RAZORPAY_KEY_ID && !process.env.RAZORPAY_KEY_ID.includes("your_"),
  })
);

const { notFound, errorHandler } = require("./middleware/error");
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("");
  console.log("🚀  CrowdFund backend running on http://localhost:" + PORT);
  console.log("📡  Health check: http://localhost:" + PORT + "/api/health");
  console.log("");

  // Warn about missing optional keys
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.includes("your_")) {
    console.warn("⚠️   GEMINI_API_KEY not set — AI Tools will not work.");
    console.warn("    Get a FREE key from: https://aistudio.google.com/app/apikey");
  }
  if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes("your_")) {
    console.warn("⚠️   RAZORPAY_KEY_ID not set — Payments will not work.");
    console.warn("    Get test keys from: https://dashboard.razorpay.com → Settings → API Keys");
  }
});

module.exports = app;
