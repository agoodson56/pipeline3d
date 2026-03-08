-- Add products column to deals, owner_id to activities/email_log if missing
ALTER TABLE deals ADD COLUMN products TEXT NOT NULL DEFAULT '[]';
