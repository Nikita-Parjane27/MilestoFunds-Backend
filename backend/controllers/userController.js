// controllers/userController.js
const User              = require("../models/User");
const Contribution      = require("../models/Contribution");
const { supabaseAdmin } = require("../config/db");
const { sendSuccess, sendError } = require("../utils/response");

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, "User not found.", 404);
    const { data: projects } = await supabaseAdmin.from("projects")
      .select("id,title,cover_image_url,amount_raised,goal_amount,status,deadline,created_at")
      .eq("creator_id", req.params.id).neq("status", "draft").order("created_at", { ascending: false });
    return sendSuccess(res, { user, projects: projects || [] });
  } catch (err) { return sendError(res, err.message); }
};

const getDashboard = async (req, res) => {
  try {
    const { data: projects } = await supabaseAdmin.from("projects")
      .select("id,title,cover_image_url,amount_raised,goal_amount,status,deadline,created_at,views")
      .eq("creator_id", req.user.id).order("created_at", { ascending: false });
    const ids = (projects || []).map((p) => p.id);
    const [recent, dailyData] = await Promise.all([
      Contribution.recentForProjects(ids),
      Contribution.dailyChart(ids),
    ]);
    return sendSuccess(res, {
      projects:            projects || [],
      totalRaised:         (projects || []).reduce((s, p) => s + (p.amount_raised || 0), 0),
      totalBackers:        new Set(recent.map((c) => c.backer_id)).size,
      dailyData,
      recentContributions: recent,
    });
  } catch (err) { return sendError(res, err.message); }
};

const getSaved = async (req, res) => {
  try { return sendSuccess(res, { projects: await User.getSaved(req.user.id) }); }
  catch (err) { return sendError(res, err.message); }
};

module.exports = { getProfile, getDashboard, getSaved };
