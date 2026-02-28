# CrowdFund — Backend API

> Node.js + Express + Supabase REST API powering the CrowdFund crowdfunding platform.

---

## 🌐 Deployment Link

**Live API:** `https://crowdfund-backend.onrender.com`  
**Health check:** `https://crowdfund-backend.onrender.com/api/health`

---

## 📋 Project Overview

CrowdFund Backend is a production-ready RESTful API providing:

- **JWT Authentication** — Register, login, profile management, password change
- **Project Management** — Full CRUD for crowdfunding campaigns with rewards and milestones
- **Payment Processing** — Razorpay integration with HMAC signature verification
- **User Dashboards** — Creator analytics, backer history, saved projects
- **AI Tools** — Gemini 2.5 Flash-powered description writer, pitch improver, reward suggestions
- **AI Recommendations** — Category-based collaborative filtering for personalised project suggestions

---

## ⚙️ Tech Stack

| Layer      | Technology              |
|------------|-------------------------|
| Runtime    | Node.js 18+             |
| Framework  | Express.js 4            |
| Database   | Supabase (PostgreSQL)   |
| Auth       | JSON Web Tokens (JWT)   |
| Payments   | Razorpay                |
| AI         | Google Gemini 2.5 Flash |
| Validation | express-validator       |
| Logging    | Morgan                  |
| Deployment | Render                  |

---

## 📂 Folder Structure

```
crowdfund-backend/
│
├── config/
│   ├── db.js              ← Supabase client (public + admin)
│   └── schema.sql         ← Full PostgreSQL database schema
│
├── controllers/
│   ├── authController.js
│   ├── projectController.js
│   ├── paymentController.js   ← Razorpay order + verify
│   ├── userController.js
│   └── aiController.js        ← Gemini 2.5 Flash AI proxy
│
├── middleware/
│   ├── auth.js            ← JWT protect / optionalAuth / adminOnly
│   ├── error.js           ← Global error handler + 404
│   └── validate.js        ← express-validator wrapper
│
├── models/
│   ├── User.js
│   ├── Project.js
│   └── Contribution.js
│
├── routes/
│   ├── authRoutes.js
│   ├── projectRoutes.js
│   ├── paymentRoutes.js
│   ├── userRoutes.js
│   └── aiRoutes.js
│
├── utils/
│   ├── jwt.js             ← signToken / verifyToken
│   └── response.js        ← sendSuccess / sendError / sendPaginated
│
├── .env.example           ← copy to .env and fill in your keys
└── server.js
```

---

## 🗄️ Database Schema

> Run `config/schema.sql` in Supabase SQL Editor to create all tables.

### Tables

| Table              | Description                                           |
|--------------------|-------------------------------------------------------|
| `users`            | Accounts, profile info, totals                        |
| `projects`         | Campaigns with category, goal, deadline, status       |
| `rewards`          | Reward tiers per project                              |
| `milestones`       | Funding milestones with auto-trigger logic            |
| `contributions`    | Payments linked to backers, projects, rewards         |
| `comments`         | Project discussion threads                            |
| `project_updates`  | Creator update posts                                  |
| `saved_projects`   | User bookmarks (junction table)                       |

### Relationships

```
users ──< projects (creator_id)
             ├──< rewards
             ├──< milestones
             ├──< project_updates
             └──< contributions >── users (backer_id)
                  └──< comments >── users (author_id)
users ──< saved_projects >── projects
```

**Auto-behaviours (server logic):**
- Milestones auto-mark `reached = true` when funding percentage is hit
- Project status auto-changes to `funded` when `amount_raised >= goal_amount`
- `updated_at` refreshes via PostgreSQL triggers

---

## 🔗 API Documentation

**Base URL:** `/api`

All success responses:
```json
{ "success": true, "message": "...", "data": {} }
```

All error responses:
```json
{ "success": false, "message": "Description of error" }
```

---

### Auth Routes — `/api/auth`

| Method | Endpoint           | Auth | Description              |
|--------|--------------------|------|--------------------------|
| POST   | `/register`        | ❌    | Create account            |
| POST   | `/login`           | ❌    | Login, returns JWT token  |
| GET    | `/me`              | ✅    | Get current user          |
| PUT    | `/profile`         | ✅    | Update profile            |
| PUT    | `/change-password` | ✅    | Change password           |

**Register / Login body:**
```json
{ "name": "Alice", "email": "alice@example.com", "password": "secret123" }
```
Returns `{ token, user }` — store `token` in `localStorage`.

---

### Project Routes — `/api/projects`

| Method | Endpoint                 | Auth | Description                  |
|--------|--------------------------|------|------------------------------|
| GET    | `/`                      | ❌    | List/search projects         |
| GET    | `/featured`              | ❌    | Featured projects            |
| GET    | `/recommendations`       | ✅    | Personalised suggestions     |
| GET    | `/:id`                   | ❌    | Project + full details       |
| POST   | `/`                      | ✅    | Create project               |
| PUT    | `/:id`                   | ✅    | Update project               |
| DELETE | `/:id`                   | ✅    | Delete project               |
| POST   | `/:id/comments`          | ✅    | Add comment                  |
| DELETE | `/:id/comments/:cid`     | ✅    | Delete own comment           |
| POST   | `/:id/updates`           | ✅    | Post update                  |
| POST   | `/:id/impact-report`     | ✅    | Publish impact report        |
| POST   | `/:id/save`              | ✅    | Toggle bookmark              |
| GET    | `/:id/contributors`      | ❌    | List backers                 |

**GET / query params:**
```
?search=text&category=Technology&sort=newest|most-funded|ending-soon|oldest
&page=1&limit=12&status=active
```

---

### Payment Routes — `/api/payments`

| Method | Endpoint                    | Auth | Description                        |
|--------|-----------------------------|------|------------------------------------|
| POST   | `/create-order`             | ✅    | Create Razorpay order              |
| POST   | `/verify`                   | ✅    | Verify payment signature           |
| GET    | `/contribution/:paymentId`  | ✅    | Get contribution by payment ID     |
| GET    | `/my-contributions`         | ✅    | User backing history               |

**POST /create-order body:**
```json
{ "projectId": "uuid", "amount": 500, "rewardId": "uuid" }
```
Returns `{ orderId, amount, currency, keyId }` — used by frontend to open Razorpay popup.

**POST /verify body:**
```json
{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_hash",
  "projectId": "uuid",
  "amount": 50000
}
```

---

### AI Routes — `/api/ai`

| Method | Endpoint     | Auth | Description                    |
|--------|--------------|------|--------------------------------|
| POST   | `/generate`  | ✅    | Generate AI content via Gemini 2.5 Flash |

**POST /generate body:**
```json
{ "tool": "description", "inputs": { "title": "My Project", "category": "Tech", "summary": "..." } }
```
**Available tools:** `description` · `title` · `rewards` · `pitch` · `risks`

---

### User Routes — `/api/users`

| Method | Endpoint         | Auth | Description                  |
|--------|------------------|------|------------------------------|
| GET    | `/dashboard`     | ✅    | Creator stats + chart data   |
| GET    | `/saved`         | ✅    | Saved projects               |
| GET    | `/:id/profile`   | ❌    | Public profile               |

---

## 🚀 Installation & Local Setup

**Prerequisites:** Node.js ≥ 18, Supabase account, Razorpay account

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/crowdfund-backend.git
cd crowdfund-backend

# 2. Install
npm install

# 3. Environment
cp .env.example .env
# Open .env and fill in your Supabase, Razorpay, JWT, and Gemini values

# 4. Database — paste config/schema.sql into Supabase SQL Editor and Run

# 5. Start
npm run dev
# → http://localhost:5000/api/health
```

### Required .env variables

```env
PORT=5000
NODE_ENV=development

# Supabase — from dashboard.supabase.com → Settings → API
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# JWT — any long random string
JWT_SECRET=your_long_random_secret_here
JWT_EXPIRES_IN=7d

# Razorpay — from dashboard.razorpay.com → Settings → API Keys
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:5173

# Google Gemini API — FREE key from https://aistudio.google.com/app/apikey
GEMINI_API_KEY=AIza...your_gemini_key_here
```

---

## ☁️ Deployment on Render

1. Push to GitHub
2. Render → **New Web Service** → connect repo
3. **Build Command:** `npm install` | **Start Command:** `npm start`
4. Add all `.env` variables under **Environment** (use your live Razorpay keys for production: `rzp_live_...`)
5. Update `CLIENT_URL` to your Netlify frontend URL
6. Deploy

---

## 🔒 Security Notes

- Passwords hashed with bcrypt (12 rounds)
- JWT expires in 7 days
- Razorpay payments verified with HMAC-SHA256 signature on every transaction
- Supabase service-role key only used server-side, never exposed to frontend
- CORS restricted to `CLIENT_URL`
- Gemini API key stays on server — never sent to browser
