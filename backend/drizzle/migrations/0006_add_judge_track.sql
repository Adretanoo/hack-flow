-- Migration: add judge_track table
-- Assigns judges to specific tracks within a hackathon

CREATE TABLE IF NOT EXISTS judge_track (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  track_id      UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  hackathon_id  UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  is_head_judge BOOLEAN NOT NULL DEFAULT false,
  assigned_at   TIMESTAMP NOT NULL DEFAULT now(),
  assigned_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(user_id, track_id)
);

CREATE INDEX IF NOT EXISTS idx_judge_track_hackathon ON judge_track(hackathon_id);
CREATE INDEX IF NOT EXISTS idx_judge_track_track     ON judge_track(track_id);
CREATE INDEX IF NOT EXISTS idx_judge_track_user      ON judge_track(user_id);
