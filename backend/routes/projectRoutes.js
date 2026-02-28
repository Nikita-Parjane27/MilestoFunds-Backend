// routes/projectRoutes.js
const express  = require("express");
const { body } = require("express-validator");
const router   = express.Router();
const { getProjects, getFeatured, getRecommendations, getProjectById, createProject, updateProject, deleteProject, addComment, deleteComment, postUpdate, publishImpactReport, toggleSave, getContributors } = require("../controllers/projectController");
const { protect, optionalAuth } = require("../middleware/auth");
const { validate }              = require("../middleware/validate");

// Static routes MUST be declared before dynamic /:id
router.get("/",                optionalAuth, getProjects);
router.get("/featured",                      getFeatured);
router.get("/recommendations", protect,      getRecommendations);

router.get   ("/:id",  optionalAuth, getProjectById);
router.put   ("/:id",  protect,      updateProject);
router.delete("/:id",  protect,      deleteProject);
router.post  ("/", [
  protect,
  body("title").trim().notEmpty().withMessage("Title is required"),
  body("description").notEmpty().withMessage("Description is required"),
  body("category").notEmpty().withMessage("Category is required"),
  body("goal_amount").isFloat({ min: 100 }).withMessage("Goal must be ≥ $100"),
  body("deadline").isISO8601().withMessage("Valid deadline required"),
  validate,
], createProject);

router.post  ("/:id/comments",       protect, addComment);
router.delete("/:id/comments/:cid",  protect, deleteComment);
router.post  ("/:id/updates",        protect, postUpdate);
router.post  ("/:id/impact-report",  protect, publishImpactReport);
router.post  ("/:id/save",           protect, toggleSave);
router.get   ("/:id/contributors",            getContributors);

module.exports = router;
