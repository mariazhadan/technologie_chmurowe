const db = require('./db');

async function ensureRuntimeSchema() {
  await db.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_subject VARCHAR(255)');
  await db.query('ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL');
  await db.query(
    `UPDATE users
        SET oauth_subject = CASE
          WHEN email = 'admin@xpo-logistics.com' THEN '11111111-1111-1111-1111-111111111111'
          WHEN email = 'mod@xpo-logistics.com' THEN '22222222-2222-2222-2222-222222222222'
          ELSE email
        END
      WHERE oauth_subject IS NULL`
  );
  await db.query('CREATE UNIQUE INDEX IF NOT EXISTS users_oauth_subject_idx ON users(oauth_subject)');
}

module.exports = { ensureRuntimeSchema };
