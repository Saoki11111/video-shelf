CREATE TABLE IF NOT EXISTS video_views (
  video_id TEXT PRIMARY KEY,
  view_count INTEGER NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

