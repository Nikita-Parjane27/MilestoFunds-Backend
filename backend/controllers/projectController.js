// controllers/projectController.js
const Project      = require("../models/Project");
const Contribution = require("../models/Contribution");
const { supabaseAdmin } = require("../config/db");
const { sendSuccess, sendError, sendPaginated } = require("../utils/response");

const getProjects = async (req, res) => {
  try {
    const { search, category, sort, page = 1, limit = 12, status } = req.query;
    const { projects, total } = await Project.findAll({ search, category, sort, page, limit, status });
    return sendPaginated(res, projects, total, page, limit);
  } catch (err) { return sendError(res, err.message); }
};

const getFeatured = async (req, res) => {
  try { return sendSuccess(res, { projects: await Project.getFeatured() }); }
  catch (err) { return sendError(res, err.message); }
};

const getRecommendations = async (req, res) => {
  try { return sendSuccess(res, { projects: await Project.getRecommendations(req.user.id) }); }
  catch (err) { return sendError(res, err.message); }
};

const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return sendError(res, "Project not found.", 404);
    Project.incrementViews(req.params.id);
    return sendSuccess(res, { project });
  } catch (err) { return sendError(res, err.message); }
};

const createProject = async (req, res) => {
  try {
    const { rewards, milestones, tags, ...rest } = req.body;
    const project = await Project.create({
      ...rest,
      creator_id: req.user.id,
      tags:       Array.isArray(tags) ? tags : (tags || "").split(",").map((t) => t.trim()).filter(Boolean),
      rewards:    rewards    ? (typeof rewards    === "string" ? JSON.parse(rewards)    : rewards)    : [],
      milestones: milestones ? (typeof milestones === "string" ? JSON.parse(milestones) : milestones) : [],
    });
    return sendSuccess(res, { project }, "Project created", 201);
  } catch (err) { return sendError(res, err.message, 400); }
};

const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return sendError(res, "Project not found.", 404);
    if (project.creator_id !== req.user.id) return sendError(res, "Not authorised.", 403);
    return sendSuccess(res, { project: await Project.update(req.params.id, req.body) }, "Updated");
  } catch (err) { return sendError(res, err.message, 400); }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return sendError(res, "Project not found.", 404);
    if (project.creator_id !== req.user.id) return sendError(res, "Not authorised.", 403);
    await Project.delete(req.params.id);
    return sendSuccess(res, {}, "Project deleted");
  } catch (err) { return sendError(res, err.message); }
};

const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return sendError(res, "Comment text is required.", 400);
    const { data, error } = await supabaseAdmin.from("comments")
      .insert({ project_id: req.params.id, author_id: req.user.id, text: text.trim() })
      .select("*, author:users!author_id(id,name,avatar_url)").single();
    if (error) return sendError(res, error.message, 400);
    return sendSuccess(res, { comment: data }, "Comment added", 201);
  } catch (err) { return sendError(res, err.message); }
};

const deleteComment = async (req, res) => {
  try {
    const { data: c } = await supabaseAdmin.from("comments").select("author_id")
      .eq("id", req.params.cid).single();
    if (!c) return sendError(res, "Comment not found.", 404);
    if (c.author_id !== req.user.id) return sendError(res, "Not authorised.", 403);
    await supabaseAdmin.from("comments").delete().eq("id", req.params.cid);
    return sendSuccess(res, {}, "Comment deleted");
  } catch (err) { return sendError(res, err.message); }
};

const postUpdate = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return sendError(res, "Project not found.", 404);
    if (project.creator_id !== req.user.id) return sendError(res, "Not authorised.", 403);
    const { data, error } = await supabaseAdmin.from("project_updates")
      .insert({ project_id: req.params.id, title: req.body.title, body: req.body.body })
      .select("*").single();
    if (error) return sendError(res, error.message, 400);
    return sendSuccess(res, { update: data }, "Update posted", 201);
  } catch (err) { return sendError(res, err.message); }
};

const publishImpactReport = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return sendError(res, "Project not found.", 404);
    if (project.creator_id !== req.user.id) return sendError(res, "Not authorised.", 403);
    const { summary, highlights } = req.body;
    await supabaseAdmin.from("projects").update({
      impact_published: true, impact_summary: summary || "",
      impact_highlights: Array.isArray(highlights)
        ? highlights : (highlights || "").split("\n").map((s) => s.trim()).filter(Boolean),
      impact_at: new Date().toISOString(),
    }).eq("id", req.params.id);
    return sendSuccess(res, {}, "Impact report published");
  } catch (err) { return sendError(res, err.message); }
};

const toggleSave = async (req, res) => {
  try {
    const User  = require("../models/User");
    const saved = await User.toggleSave(req.user.id, req.params.id);
    return sendSuccess(res, { saved }, saved ? "Project saved" : "Unsaved");
  } catch (err) { return sendError(res, err.message); }
};

const getContributors = async (req, res) => {
  try { return sendSuccess(res, { contributors: await Contribution.findByProject(req.params.id) }); }
  catch (err) { return sendError(res, err.message); }
};

module.exports = {
  getProjects, getFeatured, getRecommendations, getProjectById,
  createProject, updateProject, deleteProject,
  addComment, deleteComment, postUpdate, publishImpactReport,
  toggleSave, getContributors,
};
