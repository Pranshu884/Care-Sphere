import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_PATH = process.env.OTP_DB_PATH || path.join(process.cwd(), 'data', 'care-sphere.sqlite');

function ensureDirForFile(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

ensureDirForFile(DB_PATH);

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS otp_challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    purpose TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    used_at INTEGER NULL,
    attempts_left INTEGER NOT NULL,
    cooldown_until INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_otp_email_purpose_created
  ON otp_challenges(email, purpose, created_at DESC);
`);

function getLatestChallengeByEmailAndPurpose({ email, purpose }) {
  return db
    .prepare(
      `SELECT * FROM otp_challenges
       WHERE email = ? AND purpose = ?
       ORDER BY created_at DESC
       LIMIT 1`
    )
    .get(email, purpose);
}

function getLatestActiveChallenge({ email, purpose }) {
  return db
    .prepare(
      `SELECT * FROM otp_challenges
       WHERE email = ? AND purpose = ? AND used_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1`
    )
    .get(email, purpose);
}

function insertOtpChallenge({ email, purpose, otpHash, createdAt, expiresAt, attemptsLeft, cooldownUntil }) {
  db.prepare(
    `INSERT INTO otp_challenges (email, purpose, otp_hash, created_at, expires_at, used_at, attempts_left, cooldown_until)
     VALUES (?, ?, ?, ?, ?, NULL, ?, ?)`
  ).run(email, purpose, otpHash, createdAt, expiresAt, attemptsLeft, cooldownUntil);
}

function invalidateUnusedChallenges({ email, purpose, usedAt }) {
  db.prepare(`UPDATE otp_challenges SET used_at = ? WHERE email = ? AND purpose = ? AND used_at IS NULL`).run(usedAt, email, purpose);
}

function markUsed({ id, usedAt }) {
  db.prepare(`UPDATE otp_challenges SET used_at = ? WHERE id = ?`).run(usedAt, id);
}

function decrementAttempts({ id }) {
  const row = db.prepare(`SELECT attempts_left FROM otp_challenges WHERE id = ?`).get(id);
  const next = Math.max(0, Number(row?.attempts_left ?? 0) - 1);
  db.prepare(`UPDATE otp_challenges SET attempts_left = ?, used_at = CASE WHEN ? <= 0 THEN ? ELSE used_at END WHERE id = ?`)
    .run(next, next, Date.now(), id);
  return { attemptsLeft: next };
}

const repository = {
  getLatestChallengeByEmailAndPurpose,
  getLatestActiveChallenge,
  insertOtpChallenge,
  invalidateUnusedChallenges,
  markUsed,
  decrementAttempts
};

export default repository;

