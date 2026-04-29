-- Create team_awards join table for assigning awards to teams
CREATE TABLE IF NOT EXISTS "team_awards" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "team_id" uuid NOT NULL,
  "award_id" uuid NOT NULL,
  "assigned_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "team_awards_team_award_unique" UNIQUE("team_id", "award_id")
);

DO $$ BEGIN
  ALTER TABLE "team_awards"
    ADD CONSTRAINT "team_awards_team_id_teams_id_fk"
    FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "team_awards"
    ADD CONSTRAINT "team_awards_award_id_awards_id_fk"
    FOREIGN KEY ("award_id") REFERENCES "public"."awards"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN null; END $$;
