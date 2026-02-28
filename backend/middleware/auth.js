// middleware/auth.js
const { verifyToken }   = require("../utils/jwt");
const { supabaseAdmin } = require("../config/db");
const { sendError }     = require("../utils/response");

const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer "))
      return sendError(res, "Not authenticated. Please log in.", 401);
    const decoded = verifyToken(header.split(" ")[1]);
    const { data: user, error } = await supabaseAdmin
      .from("users").select("id, name, email, avatar_url, role")
      .eq("id", decoded.id).single();
    if (error || !user) return sendError(res, "User no longer exists.", 401);
    req.user = user;
    next();
  } catch {
    sendError(res, "Token is invalid or expired.", 401);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (header?.startsWith("Bearer ")) {
      const decoded = verifyToken(header.split(" ")[1]);
      const { data: user } = await supabaseAdmin
        .from("users").select("id, name, email, avatar_url, role")
        .eq("id", decoded.id).single();
      if (user) req.user = user;
    }
  } catch { /* silent */ }
  next();
};

const adminOnly = (req, res, next) =>
  req.user?.role === "admin" ? next() : sendError(res, "Admin access required.", 403);

module.exports = { protect, optionalAuth, adminOnly };
