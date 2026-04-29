-- Add status column to hackathons table
ALTER TABLE hackathons
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED'));

-- Index for efficient status-check queries
CREATE INDEX IF NOT EXISTS idx_hackathons_status ON hackathons(status);
