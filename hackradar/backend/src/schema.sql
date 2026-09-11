-- HackRadar schema
-- This mirrors backend/prisma/schema.prisma exactly. That file documents the
-- Postgres/Prisma version of this same model for when the project moves to a
-- real server + Postgres (Phase 2+). For local dev we run this directly
-- against SQLite via better-sqlite3, so there's zero setup required.

CREATE TABLE IF NOT EXISTS events (
  id                    TEXT PRIMARY KEY,
  title                 TEXT NOT NULL,
  organizer             TEXT NOT NULL,
  source                TEXT NOT NULL,
  sourceUrl             TEXT,
  type                  TEXT NOT NULL CHECK (type IN ('HACKATHON','CONTEST')),
  description           TEXT NOT NULL,
  imageUrl              TEXT,

  startDate             TEXT NOT NULL,
  endDate               TEXT NOT NULL,
  registrationDeadline  TEXT,

  location              TEXT NOT NULL,
  mode                  TEXT NOT NULL CHECK (mode IN ('ONLINE','OFFLINE','HYBRID')),

  eligibility           TEXT NOT NULL,
  teamSizeMin           INTEGER,
  teamSizeMax           INTEGER,

  prizePool             INTEGER,
  prizeCurrency         TEXT DEFAULT '₹',
  tags                  TEXT NOT NULL DEFAULT '',
  skills                TEXT NOT NULL DEFAULT '',

  registrationUrl       TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'UPCOMING',

  difficulty            TEXT,
  durationMinutes       INTEGER,

  createdAt             TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt             TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  college           TEXT,
  year              TEXT,
  city              TEXT,
  state             TEXT,
  skills            TEXT NOT NULL DEFAULT '',
  interests         TEXT NOT NULL DEFAULT '',
  modePreference    TEXT NOT NULL DEFAULT 'ANY',
  experienceLevel   TEXT NOT NULL DEFAULT 'BEGINNER',
  preferredTeamSize INTEGER,
  createdAt         TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt         TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS saved_events (
  id       TEXT PRIMARY KEY,
  userId   TEXT NOT NULL,
  eventId  TEXT NOT NULL,
  savedAt  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(userId, eventId),
  FOREIGN KEY (userId) REFERENCES user_profiles(id),
  FOREIGN KEY (eventId) REFERENCES events(id)
);

CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_deadline ON events(registrationDeadline);
