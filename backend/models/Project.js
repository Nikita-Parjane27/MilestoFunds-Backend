// models/Project.js
const { supabaseAdmin } = require("../config/db");

const addVirtuals = (p) => ({
  ...p,
  backer_count:       (p.contributions || []).length,
  funding_percentage: Math.min(((p.amount_raised / p.goal_amount) * 100), 100).toFixed(1),
  days_left:          Math.max(0, Math.ceil((new Date(p.deadline) - Date.now()) / 86_400_000)),
});

const Project = {
  async findAll({ search, category, sort = "newest", page = 1, limit = 12, status = "active" }) {
    let q = supabaseAdmin.from("projects")
      .select("*, creator:users!creator_id(id,name,avatar_url), rewards(id,title,min_amount,max_backers,backer_count), contributions(id)", { count: "exact" })
      .eq("status", status);
    if (category) q = q.eq("category", category);
    if (search)   q = q.ilike("title", `%${search}%`);
    const sorts = { newest: ["created_at", false], oldest: ["created_at", true], "most-funded": ["amount_raised", false], "ending-soon": ["deadline", true] };
    const [col, asc] = sorts[sort] || sorts.newest;
    q = q.order(col, { ascending: asc });
    const from = (page - 1) * Number(limit);
    q = q.range(from, from + Number(limit) - 1);
    const { data, error, count } = await q;
    if (error) throw new Error(error.message);
    return { projects: (data || []).map(addVirtuals), total: count || 0 };
  },

  async findById(id) {
    const { data, error } = await supabaseAdmin.from("projects")
      .select("*, creator:users!creator_id(id,name,avatar_url,bio,website), rewards(*), milestones(*), project_updates(*), comments(*, author:users!author_id(id,name,avatar_url)), contributions(id,backer_id)")
      .eq("id", id).single();
    if (error) return null;
    return addVirtuals(data);
  },

  async create({ rewards = [], milestones = [], ...rest }) {
    const { data: project, error } = await supabaseAdmin.from("projects")
      .insert(rest).select("*").single();
    if (error) throw new Error(error.message);
    if (rewards.length)
      await supabaseAdmin.from("rewards").insert(rewards.map((r) => ({ ...r, project_id: project.id })));
    if (milestones.length)
      await supabaseAdmin.from("milestones").insert(milestones.map((m) => ({ ...m, project_id: project.id })));
    return this.findById(project.id);
  },

  async update(id, fields) {
    const { data, error } = await supabaseAdmin.from("projects")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id).select("*").single();
    if (error) throw new Error(error.message);
    return data;
  },

  async delete(id) {
    const { error } = await supabaseAdmin.from("projects").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async incrementViews(id) {
    const { data } = await supabaseAdmin.from("projects").select("views").eq("id", id).single();
    if (data) await supabaseAdmin.from("projects").update({ views: (data.views || 0) + 1 }).eq("id", id);
  },

  async getFeatured(limit = 6) {
    const { data } = await supabaseAdmin.from("projects")
      .select("*, creator:users!creator_id(id,name,avatar_url), contributions(id)")
      .eq("featured", true).eq("status", "active")
      .order("amount_raised", { ascending: false }).limit(limit);
    return (data || []).map(addVirtuals);
  },

  async getRecommendations(userId, limit = 6) {
    const { data: backed } = await supabaseAdmin.from("contributions")
      .select("project_id, projects(category)").eq("backer_id", userId).eq("status", "completed");
    const backedIds  = (backed || []).map((b) => b.project_id);
    const categories = [...new Set((backed || []).map((b) => b.projects?.category).filter(Boolean))];
    let q = supabaseAdmin.from("projects")
      .select("*, creator:users!creator_id(id,name,avatar_url), contributions(id)").eq("status", "active");
    if (categories.length) q = q.in("category", categories);
    if (backedIds.length)  q = q.not("id", "in", `(${backedIds.join(",")})`);
    const { data } = await q.order("amount_raised", { ascending: false }).limit(limit);
    if (data?.length) return data.map(addVirtuals);
    const { data: popular } = await supabaseAdmin.from("projects")
      .select("*, creator:users!creator_id(id,name,avatar_url), contributions(id)")
      .eq("status", "active").order("amount_raised", { ascending: false }).limit(limit);
    return (popular || []).map(addVirtuals);
  },

  async checkMilestones(projectId) {
    const { data: p } = await supabaseAdmin.from("projects")
      .select("amount_raised,goal_amount,status").eq("id", projectId).single();
    if (!p) return;
    const pct = (p.amount_raised / p.goal_amount) * 100;
    const { data: ms } = await supabaseAdmin.from("milestones")
      .select("id").eq("project_id", projectId).eq("reached", false).lte("percentage", pct);
    if (ms?.length)
      await supabaseAdmin.from("milestones")
        .update({ reached: true, reached_at: new Date().toISOString() })
        .in("id", ms.map((m) => m.id));
    if (p.amount_raised >= p.goal_amount && p.status === "active")
      await supabaseAdmin.from("projects").update({ status: "funded" }).eq("id", projectId);
  },
};

module.exports = Project;
