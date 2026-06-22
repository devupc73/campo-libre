ALTER TABLE matches ADD COLUMN IF NOT EXISTS invitation_code VARCHAR;
CREATE UNIQUE INDEX IF NOT EXISTS ix_matches_invitation_code ON matches(invitation_code);
