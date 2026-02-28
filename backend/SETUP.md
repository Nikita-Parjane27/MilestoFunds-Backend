# 🔧 Backend Setup — Fix 500 Errors

## Why You're Getting 500 Errors

The 500 errors happen because your `.env` file has **placeholder values** instead of real keys. The backend can't connect to Supabase.

---

## Step 1 — Create Your `.env` File

In the `crowdfund-backend` folder, create a file named **exactly** `.env` (no other name).

Copy this and fill in your real values:

```env
PORT=5000
NODE_ENV=development

# ── SUPABASE (required) ──────────────────────────────────────
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ── JWT (required) ───────────────────────────────────────────
JWT_SECRET=any_random_long_string_minimum_32_characters_here
JWT_EXPIRES_IN=7d

# ── RAZORPAY (required for payments) ────────────────────────
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
RAZORPAY_KEY_SECRET=your_razorpay_secret

# ── CLIENT ──────────────────────────────────────────────────
CLIENT_URL=http://localhost:5173

# ── GEMINI AI (optional) ─────────────────────────────────────
GEMINI_API_KEY=AIzaSy_your_gemini_api_key_here
```

---

## Step 2 — Get Your Supabase Keys

1. Go to **https://supabase.com** → Log in
2. Open your project
3. Click **Settings** (gear icon on left) → **API**
4. Copy these 3 values:

| Field in Supabase | Paste into .env as |
|---|---|
| **Project URL** | `SUPABASE_URL` |
| **anon / public** key | `SUPABASE_ANON_KEY` |
| **service_role** key | `SUPABASE_SERVICE_ROLE_KEY` |

> ⚠️ The `service_role` key is a secret — never share it or commit it to GitHub.

---

## Step 3 — Get Razorpay Test Keys (No KYC needed)

1. Go to **https://dashboard.razorpay.com**
2. Make sure **Test Mode** is ON (toggle in top right)
3. Settings → API Keys → **Generate Test Key**
4. Copy Key ID (`rzp_test_...`) and Key Secret into `.env`

---

## Step 4 — Get Gemini API Key (Free, Optional)

1. Go to **https://aistudio.google.com/app/apikey**
2. Click **Create API Key**
3. Copy and paste into `.env` as `GEMINI_API_KEY`
4. It's completely free with generous daily limits!

---

## Step 5 — Restart Backend

After saving `.env`, stop the server (`Ctrl+C`) and restart:

```bash
npm run dev
```

You should now see:
```
✅  Supabase connected: https://YOUR_PROJECT.supabase.co
🚀  CrowdFund backend on http://localhost:5000
```

---

## Common Errors & Fixes

| Error | Cause | Fix |
|---|---|---|
| `500` on any route | Wrong Supabase keys | Re-check SUPABASE_URL and keys |
| `AxiosError: timeout` | Placeholder URL in .env | Replace `your-project-ref` with real project ref |
| `AI features not configured` | Missing GEMINI_API_KEY | Add GEMINI_API_KEY to .env |
| `Invalid GEMINI_API_KEY` | Wrong key | Get a new key from aistudio.google.com |
| `CORS error` | Wrong CLIENT_URL | Set CLIENT_URL=http://localhost:5173 |
