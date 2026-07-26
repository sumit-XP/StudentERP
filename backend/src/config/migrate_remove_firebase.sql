-- Remove Firebase Auth: Rename firebase_uid to uid and add password_hash

ALTER TABLE users RENAME COLUMN firebase_uid TO uid;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
