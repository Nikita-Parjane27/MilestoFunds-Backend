-- ============================================================
--  CrowdFund Platform — Complete Supabase Database Schema
--  Run this entire file in: Supabase → SQL Editor → New Query
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- TABLE: users
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  avatar_url    TEXT          NOT NULL DEFAULT '',
  bio           TEXT          NOT NULL DEFAULT '',
  website       VARCHAR(255)  NOT NULL DEFAULT '',
  role          VARCHAR(20)   NOT NULL DEFAULT 'user'
                              CHECK (role IN ('user', 'admin')),
  total_backed  NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_raised  NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABLE: projects
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id        UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title             VARCHAR(120)  NOT NULL,
  short_description VARCHAR(200)  NOT NULL DEFAULT '',
  description       TEXT          NOT NULL,
  category          VARCHAR(50)   NOT NULL
                    CHECK (category IN (
                      'Technology','Art','Music','Film','Food',
                      'Games','Health','Education','Community','Fashion','Other'
                    )),
  cover_image_url   TEXT          NOT NULL DEFAULT '',
  goal_amount       NUMERIC(12,2) NOT NULL CHECK (goal_amount >= 100),
  amount_raised     NUMERIC(12,2) NOT NULL DEFAULT 0,
  deadline          DATE          NOT NULL,
  status            VARCHAR(20)   NOT NULL DEFAULT 'active'
                    CHECK (status IN ('draft','active','funded','ended','cancelled')),
  tags              TEXT[]        NOT NULL DEFAULT '{}',
  featured          BOOLEAN       NOT NULL DEFAULT FALSE,
  views             INTEGER       NOT NULL DEFAULT 0,
  impact_published  BOOLEAN       NOT NULL DEFAULT FALSE,
  impact_summary    TEXT          NOT NULL DEFAULT '',
  impact_highlights TEXT[]        NOT NULL DEFAULT '{}',
  impact_at         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABLE: rewards  (backer reward tiers per project)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rewards (
  id                 UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id         UUID          NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title              VARCHAR(100)  NOT NULL,
  description        TEXT          NOT NULL DEFAULT '',
  min_amount         NUMERIC(10,2) NOT NULL CHECK (min_amount >= 1),
  max_backers        INTEGER,
  backer_count       INTEGER       NOT NULL DEFAULT 0,
  items              TEXT[]        NOT NULL DEFAULT '{}',
  estimated_delivery VARCHAR(100)  NOT NULL DEFAULT '',
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABLE: milestones  (project funding targets)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS milestones (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID          NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title       VARCHAR(150)  NOT NULL,
  description TEXT          NOT NULL DEFAULT '',
  percentage  INTEGER       NOT NULL CHECK (percentage BETWEEN 1 AND 100),
  amount      NUMERIC(12,2) NOT NULL,
  reached     BOOLEAN       NOT NULL DEFAULT FALSE,
  reached_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABLE: contributions  (payment records)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contributions (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  backer_id         UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id        UUID          NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  reward_id         UUID          REFERENCES rewards(id) ON DELETE SET NULL,
  amount            NUMERIC(10,2) NOT NULL CHECK (amount >= 1),
  razorpay_order_id   VARCHAR(255)  NOT NULL DEFAULT '',
  razorpay_payment_id VARCHAR(255)  NOT NULL DEFAULT '',
  status            VARCHAR(20)   NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','completed','refunded','failed')),
  message           TEXT          NOT NULL DEFAULT '',
  anonymous         BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABLE: comments
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id         UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID    NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author_id  UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text       TEXT    NOT NULL CHECK (char_length(text) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABLE: project_updates  (creator posts)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_updates (
  id         UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID         NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title      VARCHAR(200) NOT NULL,
  body       TEXT         NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABLE: saved_projects  (user bookmarks)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_projects (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, project_id)
);

-- ─────────────────────────────────────────────────────────────
-- PERFORMANCE INDEXES
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_projects_creator   ON projects(creator_id);
CREATE INDEX IF NOT EXISTS idx_projects_category  ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_status    ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_featured  ON projects(featured);
CREATE INDEX IF NOT EXISTS idx_contrib_backer     ON contributions(backer_id);
CREATE INDEX IF NOT EXISTS idx_contrib_project    ON contributions(project_id);
CREATE INDEX IF NOT EXISTS idx_contrib_status     ON contributions(status);
CREATE INDEX IF NOT EXISTS idx_comments_project   ON comments(project_id);
CREATE INDEX IF NOT EXISTS idx_rewards_project    ON rewards(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_project ON milestones(project_id);

-- ─────────────────────────────────────────────────────────────
-- AUTO-UPDATE updated_at TRIGGER
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION refresh_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_users_upd    BEFORE UPDATE ON users    FOR EACH ROW EXECUTE FUNCTION refresh_updated_at();
CREATE TRIGGER trg_projects_upd BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION refresh_updated_at();
CREATE TRIGGER trg_comments_upd BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION refresh_updated_at();
