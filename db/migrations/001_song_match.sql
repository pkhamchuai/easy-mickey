CREATE TABLE IF NOT EXISTS song_match_songs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL DEFAULT '',
  youtube_video_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS song_match_members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL DEFAULT '',
  image_blob_pathname TEXT,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS song_match_picks (
  member_id TEXT NOT NULL REFERENCES song_match_members(id) ON DELETE CASCADE,
  song_id TEXT NOT NULL REFERENCES song_match_songs(id) ON DELETE RESTRICT,
  rank SMALLINT NOT NULL CHECK (rank BETWEEN 1 AND 3),
  PRIMARY KEY (member_id, rank),
  UNIQUE (member_id, song_id)
);

CREATE TABLE IF NOT EXISTS song_match_meta (
  singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
  version BIGINT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO song_match_meta (singleton) VALUES (TRUE) ON CONFLICT DO NOTHING;
