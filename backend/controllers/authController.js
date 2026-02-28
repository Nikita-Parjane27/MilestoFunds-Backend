// controllers/authController.js
const User                       = require("../models/User");
const { signToken }              = require("../utils/jwt");
const { sendSuccess, sendError } = require("../utils/response");

const register = async (req, res) => {
  try {
    console.log("Incoming body:", req.body);

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return sendError(res, "All fields are required", 400);
    }

    const existing = await User.findByEmail(email);
    if (existing) {
      return sendError(res, "Email already registered.", 400);
    }

    const user = await User.create({ name, email, password });

    return sendSuccess(
      res,
      { token: signToken(user.id), user },
      "Registration successful",
      201
    );

  } catch (err) {
    console.error("REGISTER ERROR FULL:", err);   // 👈 VERY IMPORTANT
    return sendError(res, err.message, 500);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email);
    if (!user || !(await User.comparePassword(password, user.password_hash)))
      return sendError(res, "Invalid email or password.", 400);
    const { password_hash, ...safe } = user;
    return sendSuccess(res, { token: signToken(user.id), user: safe }, "Login successful");
  } catch (err) { return sendError(res, err.message); }
};

const getMe = async (req, res) => {
  try { return sendSuccess(res, { user: await User.findById(req.user.id) }); }
  catch (err) { return sendError(res, err.message); }
};

const updateProfile = async (req, res) => {
  try { return sendSuccess(res, { user: await User.update(req.user.id, req.body) }, "Profile updated"); }
  catch (err) { return sendError(res, err.message); }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByEmail(req.user.email);
    if (!(await User.comparePassword(currentPassword, user.password_hash)))
      return sendError(res, "Current password is incorrect.", 400);
    await User.updatePassword(req.user.id, newPassword);
    return sendSuccess(res, {}, "Password changed successfully");
  } catch (err) { return sendError(res, err.message); }
};

module.exports = { register, login, getMe, updateProfile, changePassword };
