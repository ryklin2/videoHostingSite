-- Run this once against an existing database before enabling Google OAuth.
-- Password login remains available for existing accounts; Google-only accounts
-- intentionally have a NULL password.
ALTER TABLE users
  MODIFY COLUMN password VARCHAR(255) NULL,
  ADD COLUMN google_id VARCHAR(255) NULL UNIQUE AFTER password;
