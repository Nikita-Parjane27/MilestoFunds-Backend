// config/db.js – Supabase database connection
const { createClient } = require("@supabase/supabase-js");

// ── Validate env vars at startup ───────────────────────────────────────
const missing = [];
if (!process.env.SUPABASE_URL)              missing.push("SUPABASE_URL");
if (!process.env.SUPABASE_ANON_KEY)         missing.push("SUPABASE_ANON_KEY");
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");

if (missing.length) {
  console.error("\n❌  MISSING ENVIRONMENT VARIABLES IN .env:");
  missing.forEach(k => console.error(`    → ${k}`));
  console.error("\n👉  Steps to fix:");
  console.error("    1. Go to https://supabase.com → your project → Settings → API");
  console.error("    2. Copy Project URL  → paste as SUPABASE_URL");
  console.error("    3. Copy anon/public  → paste as SUPABASE_ANON_KEY");
  console.error("    4. Copy service_role → paste as SUPABASE_SERVICE_ROLE_KEY");
  console.error("    5. Save .env and restart backend\n");
  process.exit(1);
}

// ── Detect placeholder values ──────────────────────────────────────────
if (process.env.SUPABASE_URL.includes("your-project-ref") ||
    process.env.SUPABASE_URL === "https://your-project-ref.supabase.co") {
  console.error("\n❌  SUPABASE_URL is still the example placeholder!");
  console.error("    → Open crowdfund-backend/.env");
  console.error("    → Replace SUPABASE_URL with your real project URL");
  console.error("    → Format: https://abcdefghij.supabase.co\n");
  process.exit(1);
}

// ── Create clients ─────────────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

// Admin client – bypasses RLS. ONLY use in server-side code.
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

console.log("✅  Supabase connected:", process.env.SUPABASE_URL);
module.exports = { supabase, supabaseAdmin };
