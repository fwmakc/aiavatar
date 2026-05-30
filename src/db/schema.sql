-- Dynamic relationship scores (was relationships.json)
CREATE TABLE IF NOT EXISTS relationships (
  chat_id    TEXT NOT NULL,
  user_id    INTEGER NOT NULL,
  score      INTEGER NOT NULL DEFAULT 0 CHECK(score BETWEEN -5 AND 5),
  history    TEXT NOT NULL DEFAULT '[]',
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (chat_id, user_id)
);

-- User profiles built from chat analysis (was user-profiles.json)
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id           INTEGER PRIMARY KEY,
  username          TEXT,
  first_name        TEXT,
  triggers          TEXT NOT NULL DEFAULT '[]',
  topics            TEXT NOT NULL DEFAULT '{}',
  avg_message_length REAL NOT NULL DEFAULT 0,
  aggression_rate   REAL NOT NULL DEFAULT 0,
  emoji_top         TEXT NOT NULL DEFAULT '{}',
  message_count     INTEGER NOT NULL DEFAULT 0,
  last_updated      INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Social graph edges between users (was social-graph.json)
CREATE TABLE IF NOT EXISTS social_graph (
  from_user_id      INTEGER NOT NULL,
  to_user_id        INTEGER NOT NULL,
  weight            INTEGER NOT NULL DEFAULT 0,
  interaction_count INTEGER NOT NULL DEFAULT 0,
  last_conflict     INTEGER NOT NULL DEFAULT 0,
  last_positive     INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (from_user_id, to_user_id)
);

-- Bans / guard denials (was ban/manager.ts in-memory Map)
CREATE TABLE IF NOT EXISTS bans (
  user_id     INTEGER NOT NULL,
  chat_id     TEXT NOT NULL,
  denials     INTEGER NOT NULL DEFAULT 0,
  banned_until INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, chat_id)
);

-- Chat engagement state (was content/store/state.ts in-memory Map)
CREATE TABLE IF NOT EXISTS chat_engagement (
  chat_id              INTEGER PRIMARY KEY,
  last_message_time    INTEGER NOT NULL DEFAULT 0,
  last_content_post_time INTEGER NOT NULL DEFAULT 0,
  content_history      TEXT NOT NULL DEFAULT '[]',
  posted_content       TEXT NOT NULL DEFAULT '[]',
  active_quiz          TEXT
);

-- Private DM context (was private-context.ts in-memory Map)
CREATE TABLE IF NOT EXISTS private_context (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id   INTEGER NOT NULL,
  role      TEXT NOT NULL CHECK(role IN ('User','Assistant')),
  content   TEXT NOT NULL,
  timestamp INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_private_ctx_user ON private_context(user_id, timestamp);
