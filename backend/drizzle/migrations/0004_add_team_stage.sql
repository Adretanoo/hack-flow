-- Create team_stage table (one active stage per team at a time)
-- The unique constraint on team_id is enforced at the application layer (upsert = delete+insert).
CREATE TABLE IF NOT EXISTS "team_stage" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "team_id" uuid NOT NULL,
  "stage_id" uuid NOT NULL,
  "entered_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "team_stage_team_id_unique" UNIQUE("team_id")
);

DO $$ BEGIN
  ALTER TABLE "team_stage"
    ADD CONSTRAINT "team_stage_team_id_teams_id_fk"
    FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "team_stage"
    ADD CONSTRAINT "team_stage_stage_id_stages_id_fk"
    FOREIGN KEY ("stage_id") REFERENCES "public"."stages"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null; END $$;
