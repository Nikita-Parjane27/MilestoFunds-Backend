// models/User.js
const bcrypt = require("bcryptjs");
const { supabaseAdmin } = require("../config/db");

const User = {

  // ─────────────────────────────────────────
  // Find user by email
  // ─────────────────────────────────────────
  async findByEmail(email) {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle(); // ✅ FIXED (was .single())

    // Only throw error if it's NOT "no rows found"
    if (error && error.code !== "PGRST116") {
      throw new Error(error.message);
    }

    return data || null;
  },

  // ─────────────────────────────────────────
  // Find user by ID
  // ─────────────────────────────────────────
  async findById(id) {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id,name,email,avatar_url,bio,website,role,total_backed,total_raised,created_at")
      .eq("id", id)
      .maybeSingle(); // safer than .single()

    if (error) throw new Error(error.message);
    return data || null;
  },

  // ─────────────────────────────────────────
  // Create new user
  // ─────────────────────────────────────────
  async create({ name, email, password }) {
    const password_hash = await bcrypt.hash(password, 12);

    const { data, error } = await supabaseAdmin
      .from("users")
      .insert({
        name,
        email: email.toLowerCase().trim(),
        password_hash,
      })
      .select("id,name,email,avatar_url,role")
      .single();

    if (error) throw new Error(error.message);

    return data;
  },

  // ─────────────────────────────────────────
  // Update profile
  // ─────────────────────────────────────────
  async update(id, updates) {
    const allowed = ["name", "bio", "website", "avatar_url"];

    const safe = Object.fromEntries(
      Object.entries(updates).filter(([key]) => allowed.includes(key))
    );

    const { data, error } = await supabaseAdmin
      .from("users")
      .update({
        ...safe,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id,name,email,avatar_url,bio,website,role")
      .single();

    if (error) throw new Error(error.message);

    return data;
  },

  // ─────────────────────────────────────────
  // Update password
  // ─────────────────────────────────────────
  async updatePassword(id, newPassword) {
    const password_hash = await bcrypt.hash(newPassword, 12);

    const { error } = await supabaseAdmin
      .from("users")
      .update({
        password_hash,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw new Error(error.message);
  },

  // ─────────────────────────────────────────
  // Compare password
  // ─────────────────────────────────────────
  async comparePassword(plain, hash) {
    return bcrypt.compare(plain, hash);
  },

  // ─────────────────────────────────────────
  // Toggle saved project
  // ─────────────────────────────────────────
  async toggleSave(userId, projectId) {
    const { data: existing } = await supabaseAdmin
      .from("saved_projects")
      .select("user_id")
      .eq("user_id", userId)
      .eq("project_id", projectId)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin
        .from("saved_projects")
        .delete()
        .eq("user_id", userId)
        .eq("project_id", projectId);
      return false;
    }

    await supabaseAdmin
      .from("saved_projects")
      .insert({ user_id: userId, project_id: projectId });

    return true;
  },

  // ─────────────────────────────────────────
  // Get saved projects
  // ─────────────────────────────────────────
  async getSaved(userId) {
    const { data, error } = await supabaseAdmin
      .from("saved_projects")
      .select("projects(id,title,cover_image_url,amount_raised,goal_amount,status,deadline)")
      .eq("user_id", userId);

    if (error) throw new Error(error.message);

    return (data || []).map((r) => r.projects).filter(Boolean);
  },
};

module.exports = User;