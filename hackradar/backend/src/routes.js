const express = require("express");
const db = require("./db");
const { newId, deriveStatus, splitCsv } = require("./utils");
const { scoreEvent } = require("./matchScore");

const router = express.Router();

function rowToEvent(row) {
  return {
    ...row,
    tags: splitCsv(row.tags),
    skills: splitCsv(row.skills),
    status: deriveStatus(row), // always compute live, not the stale seeded value
  };
}

function getDemoProfile() {
  const row = db.prepare("SELECT * FROM user_profiles WHERE id = ?").get("demo-user");
  if (!row) return null;
  return { ...row, skills: splitCsv(row.skills), interests: splitCsv(row.interests) };
}

function attachScore(event, profile) {
  if (!profile) return event;
  const { score, explanation } = scoreEvent(event, profile);
  return { ...event, matchScore: score, matchExplanation: explanation };
}

// ---------------------------------------------------------------------
// GET /api/events  — list + filter + search (hackathons and/or contests)
// Query params: type, search, mode, location, tag, minPrize, status,
// sort=relevance|deadline|newest|prize, page, pageSize
// ---------------------------------------------------------------------
router.get("/events", (req, res) => {
  const {
    type,
    search,
    mode,
    location,
    tag,
    status,
    sort = "relevance",
    page = "1",
    pageSize = "20",
  } = req.query;

  let rows = db.prepare("SELECT * FROM events").all().map(rowToEvent);

  if (type) rows = rows.filter((e) => e.type === type);
  if (mode) rows = rows.filter((e) => e.mode === mode);
  if (location) {
    rows = rows.filter((e) => e.location.toLowerCase().includes(location.toLowerCase()));
  }
  if (tag) rows = rows.filter((e) => e.tags.some((t) => t.toLowerCase() === tag.toLowerCase()));
    if (status) {
    rows = rows.filter((e) => e.status === status);
  } else {
    rows = rows.filter((e) => e.status !== "CLOSED"); // default view excludes past hackathons
  }
  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.organizer.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  const profile = getDemoProfile();
  rows = rows.map((e) => attachScore(e, profile));

  const sorters = {
    deadline: (a, b) => new Date(a.registrationDeadline || a.endDate) - new Date(b.registrationDeadline || b.endDate),
    newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    prize: (a, b) => (b.prizePool || 0) - (a.prizePool || 0),
    relevance: (a, b) => (b.matchScore || 0) - (a.matchScore || 0),
  };
  rows.sort(sorters[sort] || sorters.relevance);

  const p = Math.max(1, parseInt(page, 10) || 1);
  const ps = Math.max(1, Math.min(1000, parseInt(pageSize, 10) || 20));
  const start = (p - 1) * ps;
  const paged = rows.slice(start, start + ps);

  res.json({
    results: paged,
    total: rows.length,
    page: p,
    pageSize: ps,
  });
});

// ---------------------------------------------------------------------
// GET /api/events/closing-soon — deadline within 72h, primary "urgency" view
// ---------------------------------------------------------------------
router.get("/events/closing-soon", (req, res) => {
  const profile = getDemoProfile();
  const now = Date.now();
  const rows = db
    .prepare("SELECT * FROM events WHERE type = 'HACKATHON'")
    .all()
    .map(rowToEvent)
    .filter((e) => {
      if (!e.registrationDeadline) return false;
      const deadline = new Date(e.registrationDeadline).getTime();
      return deadline > now && deadline - now <= 72 * 60 * 60 * 1000;
    })
    .map((e) => attachScore(e, profile))
    .sort((a, b) => new Date(a.registrationDeadline) - new Date(b.registrationDeadline));

  res.json({ results: rows });
});

// ---------------------------------------------------------------------
// GET /api/events/:id — detail page
// ---------------------------------------------------------------------
router.get("/events/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM events WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Event not found" });
  const profile = getDemoProfile();
  res.json(attachScore(rowToEvent(row), profile));
});

// ---------------------------------------------------------------------
// GET /api/locations — city counts for the "Hackathons Across India" view
// ---------------------------------------------------------------------
router.get("/locations", (req, res) => {
  const rows = db
    .prepare("SELECT location FROM events WHERE type = 'HACKATHON' AND mode != 'ONLINE'")
    .all();
  const counts = {};
  for (const r of rows) counts[r.location] = (counts[r.location] || 0) + 1;
  const results = Object.entries(counts)
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count);
  res.json({ results });
});

// ---------------------------------------------------------------------
// Saved events
// ---------------------------------------------------------------------
router.get("/saved", (req, res) => {
  const rows = db
    .prepare(
      `SELECT e.* FROM saved_events s JOIN events e ON e.id = s.eventId WHERE s.userId = ? ORDER BY s.savedAt DESC`
    )
    .all("demo-user")
    .map(rowToEvent);
  const profile = getDemoProfile();
  res.json({ results: rows.map((e) => attachScore(e, profile)) });
});

router.post("/saved/:eventId", (req, res) => {
  const event = db.prepare("SELECT id FROM events WHERE id = ?").get(req.params.eventId);
  if (!event) return res.status(404).json({ error: "Event not found" });
  try {
    db.prepare("INSERT INTO saved_events (id, userId, eventId) VALUES (?, ?, ?)").run(
      newId("sav"),
      "demo-user",
      req.params.eventId
    );
  } catch (e) {
    // unique constraint -> already saved, treat as success (idempotent)
  }
  res.json({ saved: true });
});

router.delete("/saved/:eventId", (req, res) => {
  db.prepare("DELETE FROM saved_events WHERE userId = ? AND eventId = ?").run(
    "demo-user",
    req.params.eventId
  );
  res.json({ saved: false });
});

// ---------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------
router.get("/profile", (req, res) => {
  const profile = getDemoProfile();
  if (!profile) return res.status(404).json({ error: "No profile" });
  res.json(profile);
});

router.put("/profile", (req, res) => {
  const { name, college, year, city, state, skills, interests, modePreference, experienceLevel, preferredTeamSize } =
    req.body;
  db.prepare(
    `UPDATE user_profiles SET name=?, college=?, year=?, city=?, state=?, skills=?, interests=?, modePreference=?, experienceLevel=?, preferredTeamSize=?, updatedAt=datetime('now') WHERE id = ?`
  ).run(
    name,
    college,
    year,
    city,
    state,
    Array.isArray(skills) ? skills.join(",") : skills || "",
    Array.isArray(interests) ? interests.join(",") : interests || "",
    modePreference || "ANY",
    experienceLevel || "BEGINNER",
    preferredTeamSize || null,
    "demo-user"
  );
  res.json(getDemoProfile());
});

module.exports = router;
