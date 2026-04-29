CREATE TABLE IF NOT EXISTS hackathon_tags (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name  VARCHAR(64) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS hackathon_tag_relations (
  hackathon_id UUID NOT NULL REFERENCES hackathons(id) ON DELETE CASCADE,
  tag_id       UUID NOT NULL REFERENCES hackathon_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (hackathon_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_tag_relations_hackathon
  ON hackathon_tag_relations(hackathon_id);
CREATE INDEX IF NOT EXISTS idx_tag_relations_tag
  ON hackathon_tag_relations(tag_id);
