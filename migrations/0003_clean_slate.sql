-- Pipeline3D — Clean Slate Migration
-- Removes all demo/seed data so the app starts fresh.
-- Only real data added by your team will remain.

-- ═══════════════════════════════════════════════════════════════
-- WIPE ALL DEMO DATA
-- ═══════════════════════════════════════════════════════════════

-- Remove all demo deals
DELETE FROM deals;

-- Remove all demo contacts
DELETE FROM contacts;

-- Remove all demo companies
DELETE FROM companies;

-- Remove all demo activities
DELETE FROM activities;

-- Remove all demo emails
DELETE FROM email_log;

-- Remove all demo sessions (force everyone to re-login)
DELETE FROM sessions;

-- Pipelines are kept — they define the stage structure.
-- You can customize them in Settings → Pipelines.
