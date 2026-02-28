# 🚀 CrowdFund Backend — Setup & Troubleshooting Guide

---

## ❌ Fixing the 500 Error (Most Common Issue)

The 500 error means your **Supabase keys are wrong or missing** in the `.env` file.
The backend connects to Supabase on every API call — if the connection fails, all routes return 500.

---

## Step 1 — Create your `.env` file

In the `crowdfund-backend` folder, copy the example:

```
# Windows:
copy .env.example .env

# Mac/Linux:
cp .env.example .env
```

Then open `.env` in any text editor (Notepad, VS Code, etc.)

---

## Step 2 — Fill in your Supabase keys

1. Go to **https://supabase.com** → Open your project
2. Click **Project Settings** (gear icon, bottom left)
3. Click **API** in the sidebar
4. Copy these three values into your `.env`:

```env
SUPABASE_URL=https://abcdefghij.supabase.co          ← "Project URL"
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...               ← "anon public" key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1...        ← "service_role" key
```

> ⚠️ **IMPORTANT:** The service_role key is secret — never share it publicly.

---

## Step 3 — Fill in your Razorpay test keys

1. Go to **https://dashboard.razorpay.com**
2. Click **Settings → API Keys**
3. Make sure **Test Mode** is ON (toggle top-right)
4. Click **Generate Test Key**

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_here
```

---

## Step 4 — Fill in your Gemini AI key (FREE)

1. Go to **https://aistudio.google.com/app/apikey**
2. Click **Create API Key**
3. Copy the key

```env
GEMINI_API_KEY=AIzaSy...your_key_here
```

> ✅ Gemini API is **completely free** for development use.
> Model used: `gemini-2.5-flash-preview-05-20` (Google's latest fast model)

---

## Step 5 — Set your JWT secret

Generate any random 32+ character string:

```env
JWT_SECRET=myapp_super_secret_key_change_this_123456
```

---

## ✅ Full `.env` example

```env
PORT=5000
NODE_ENV=development

SUPABASE_URL=https://abcdefghij.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIs...

JWT_SECRET=crowdfund_my_secret_jwt_key_change_this_2025
JWT_EXPIRES_IN=7d

RAZORPAY_KEY_ID=rzp_test_abcde12345
RAZORPAY_KEY_SECRET=your_razorpay_test_secret

CLIENT_URL=http://localhost:5173

GEMINI_API_KEY=AIzaSyAbc123...your_real_key
```

---

## Step 6 — Restart the backend

```
npm run dev
```

You should see:
```
✅  Supabase connected to: abcdefghij.supabase.co
🚀  CrowdFund backend running on http://localhost:5000
```

---

## 🔍 Verify it's working

Open your browser and visit:
```
http://localhost:5000/api/health
```

You should see:
```json
{
  "success": true,
  "message": "CrowdFund API ✅",
  "supabase": true,
  "gemini": true,
  "razorpay": true
}
```

If `supabase: false` → your Supabase keys are wrong.
If `gemini: false` → your Gemini key is missing.

---

## 🐛 Common Errors

| Error | Cause | Fix |
|---|---|---|
| `500` on all routes | Wrong Supabase keys in `.env` | Re-copy keys from Supabase dashboard |
| `TypeError: fetch failed` | No internet / Supabase project paused | Check internet; unpause Supabase project |
| `"Registration failed"` | Supabase `users` table missing | Run the SQL schema in Supabase SQL editor |
| `AI features not configured` | Missing `GEMINI_API_KEY` | Add key from aistudio.google.com |
| Timeout after 10s | Supabase project is paused (free tier) | Go to Supabase → Resume project |

---

## ⚠️ Supabase Free Tier — Project Pausing

If you're on Supabase's **free plan**, your project **auto-pauses after 1 week of inactivity**.

**Fix:**
1. Go to https://supabase.com → your project
2. You'll see a "Resume Project" button
3. Click it and wait ~30 seconds
4. Restart your backend

---

## AI — Google Gemini 2.5 Flash

The AI tools use **Google Gemini 2.5 Flash** (`gemini-2.5-flash-preview-05-20`).

- ✅ **Free** — no billing needed for development
- ✅ **Fast** — responses in 2–3 seconds
- ✅ **Smart** — Google's latest and most capable model
- Get your key: https://aistudio.google.com/app/apikey
