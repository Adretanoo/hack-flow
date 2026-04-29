-- Add hackathon_id FK to mentor_availabilities (nullable for backward compatibility)
DO $$ BEGIN
  ALTER TABLE "mentor_availabilities"
    ADD COLUMN "hackathon_id" uuid;
EXCEPTION WHEN duplicate_column THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "mentor_availabilities"
    ADD CONSTRAINT "mentor_availabilities_hackathon_id_fk"
    FOREIGN KEY ("hackathon_id") REFERENCES "public"."hackathons"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN null; END $$;
