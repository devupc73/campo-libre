ALTER TABLE match_participants ADD COLUMN IF NOT EXISTS paid_players_count INTEGER DEFAULT 1;
