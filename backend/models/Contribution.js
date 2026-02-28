// models/Contribution.js
const { supabaseAdmin } = require("../config/db");

const Contribution = {

  async processPayment({
    backer_id, project_id, reward_id, amount,
    razorpay_order_id, razorpay_payment_id,
    message, anonymous,
  }) {
    // Insert contribution record
    const { data, error } = await supabaseAdmin
      .from("contributions")
      .insert({
        backer_id,
        project_id,
        reward_id:          reward_id || null,
        amount,
        razorpay_order_id,
        razorpay_payment_id,
        message:            message   || "",
        anonymous:          !!anonymous,
        status:             "completed",
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);

    // Update project amount_raised
    const { data: proj } = await supabaseAdmin
      .from("projects").select("amount_raised").eq("id", project_id).single();
    await supabaseAdmin
      .from("projects")
      .update({ amount_raised: (proj?.amount_raised || 0) + amount })
      .eq("id", project_id);

    // Update reward backer_count
    if (reward_id) {
      const { data: rw } = await supabaseAdmin
        .from("rewards").select("backer_count").eq("id", reward_id).single();
      await supabaseAdmin
        .from("rewards")
        .update({ backer_count: (rw?.backer_count || 0) + 1 })
        .eq("id", reward_id);
    }

    // Update user total_backed
    const { data: usr } = await supabaseAdmin
      .from("users").select("total_backed").eq("id", backer_id).single();
    await supabaseAdmin
      .from("users")
      .update({ total_backed: (usr?.total_backed || 0) + amount })
      .eq("id", backer_id);

    return data;
  },

  async findByPaymentId(paymentId) {
    const { data } = await supabaseAdmin
      .from("contributions")
      .select("*, projects(id,title,cover_image_url,status)")
      .eq("razorpay_payment_id", paymentId)
      .single();
    return data || null;
  },

  async findByBacker(userId) {
    const { data } = await supabaseAdmin
      .from("contributions")
      .select("*, projects(id,title,cover_image_url,status,amount_raised,goal_amount,deadline)")
      .eq("backer_id", userId)
      .eq("status", "completed")
      .order("created_at", { ascending: false });
    return data || [];
  },

  async findByProject(projectId, limit = 50) {
    const { data } = await supabaseAdmin
      .from("contributions")
      .select("*, backer:users!backer_id(id,name,avatar_url)")
      .eq("project_id", projectId)
      .eq("status", "completed")
      .order("amount", { ascending: false })
      .limit(limit);
    return data || [];
  },

  async recentForProjects(projectIds, limit = 10) {
    if (!projectIds.length) return [];
    const { data } = await supabaseAdmin
      .from("contributions")
      .select("*, backer:users!backer_id(id,name)")
      .in("project_id", projectIds)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(limit);
    return data || [];
  },

  async dailyChart(projectIds) {
    if (!projectIds.length) return [];
    const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const { data } = await supabaseAdmin
      .from("contributions")
      .select("amount,created_at")
      .in("project_id", projectIds)
      .eq("status", "completed")
      .gte("created_at", since)
      .order("created_at", { ascending: true });

    return (data || []).reduce((acc, c) => {
      const day = new Date(c.created_at).toLocaleDateString("en-IN", {
        month: "short", day: "numeric",
      });
      const found = acc.find((d) => d.date === day);
      if (found) found.amount += c.amount;
      else acc.push({ date: day, amount: c.amount });
      return acc;
    }, []);
  },
};

module.exports = Contribution;
