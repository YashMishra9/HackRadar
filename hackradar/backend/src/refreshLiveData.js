const db = require("./db");
const { newId, deriveStatus } = require("./utils");
const { fetchDevpostHackathons } = require("./sources/devpost");
const { fetchUnstopHackathons } = require("./sources/unstop");
const { fetchCodeforcesContests } = require("./sources/codeforces");
const { fetchAtCoderContests } = require("./sources/atcoder");
const { fetchCodeChefContests } = require("./sources/codechef");
const { fetchLeetCodeContests } = require("./sources/leetcode");

async function refreshDevpost() {
  try {
    const hackathons = await fetchDevpostHackathons();
    db.exec("DELETE FROM events WHERE source = 'Devpost'");

    const insertStmt = db.prepare(`
      INSERT INTO events (
        id, title, organizer, source, sourceUrl, type, description, imageUrl,
        startDate, endDate, registrationDeadline, location, mode,
        eligibility, teamSizeMin, teamSizeMax, prizePool, prizeCurrency, tags, skills,
        registrationUrl, status
      ) VALUES (
        @id, @title, @organizer, @source, @sourceUrl, @type, @description, @imageUrl,
        @startDate, @endDate, @registrationDeadline, @location, @mode,
        @eligibility, @teamSizeMin, @teamSizeMax, @prizePool, @prizeCurrency, @tags, @skills,
        @registrationUrl, @status
      )
    `);

    for (const h of hackathons) {
      const event = { ...h, id: newId("evt"), type: "HACKATHON" };
      event.status = deriveStatus(event);
      insertStmt.run(event);
    }
    console.log(`[live-data] Refreshed ${hackathons.length} hackathons from Devpost`);
  } catch (err) {
    console.error("[live-data] Devpost refresh failed:", err.message);
  }
}

async function refreshUnstop() {
  try {
    const hackathons = await fetchUnstopHackathons();
    db.exec("DELETE FROM events WHERE source = 'Unstop'");

    const insertStmt = db.prepare(`
      INSERT INTO events (
        id, title, organizer, source, sourceUrl, type, description, imageUrl,
        startDate, endDate, registrationDeadline, location, mode,
        eligibility, teamSizeMin, teamSizeMax, prizePool, prizeCurrency, tags, skills,
        registrationUrl, status
      ) VALUES (
        @id, @title, @organizer, @source, @sourceUrl, @type, @description, @imageUrl,
        @startDate, @endDate, @registrationDeadline, @location, @mode,
        @eligibility, @teamSizeMin, @teamSizeMax, @prizePool, @prizeCurrency, @tags, @skills,
        @registrationUrl, @status
      )
    `);

    for (const h of hackathons) {
      const event = { ...h, id: newId("evt"), type: "HACKATHON" };
      event.status = deriveStatus(event);
      insertStmt.run(event);
    }
    console.log(`[live-data] Refreshed ${hackathons.length} hackathons from Unstop`);
  } catch (err) {
    console.error("[live-data] Unstop refresh failed:", err.message);
  }
}

async function refreshCodeforces() {
  try {
    const contests = await fetchCodeforcesContests();
    db.exec("DELETE FROM events WHERE source = 'Codeforces'");

    const insertStmt = db.prepare(`
      INSERT INTO events (
        id, title, organizer, source, sourceUrl, type, description,
        startDate, endDate, registrationDeadline, location, mode,
        eligibility, teamSizeMin, teamSizeMax, prizePool, tags, skills,
        registrationUrl, status, difficulty, durationMinutes
      ) VALUES (
        @id, @title, @organizer, @source, @sourceUrl, @type, @description,
        @startDate, @endDate, @registrationDeadline, @location, @mode,
        @eligibility, @teamSizeMin, @teamSizeMax, @prizePool, @tags, @skills,
        @registrationUrl, @status, @difficulty, @durationMinutes
      )
    `);

    for (const c of contests) {
      const event = { ...c, id: newId("evt"), type: "CONTEST" };
      event.status = deriveStatus(event);
      insertStmt.run(event);
    }
    console.log(`[live-data] Refreshed ${contests.length} contests from Codeforces`);
  } catch (err) {
    console.error("[live-data] Codeforces refresh failed:", err.message);
  }
}

async function refreshAtCoder() {
  try {
    const contests = await fetchAtCoderContests();
    db.exec("DELETE FROM events WHERE source = 'AtCoder'");
    const insertStmt = db.prepare(`
      INSERT INTO events (
        id, title, organizer, source, sourceUrl, type, description,
        startDate, endDate, registrationDeadline, location, mode,
        eligibility, teamSizeMin, teamSizeMax, prizePool, tags, skills,
        registrationUrl, status, difficulty, durationMinutes
      ) VALUES (
        @id, @title, @organizer, @source, @sourceUrl, @type, @description,
        @startDate, @endDate, @registrationDeadline, @location, @mode,
        @eligibility, @teamSizeMin, @teamSizeMax, @prizePool, @tags, @skills,
        @registrationUrl, @status, @difficulty, @durationMinutes
      )
    `);
    for (const c of contests) {
      const event = { ...c, id: newId("evt"), type: "CONTEST" };
      event.status = deriveStatus(event);
      insertStmt.run(event);
    }
    console.log(`[live-data] Refreshed ${contests.length} contests from AtCoder`);
  } catch (err) {
    console.error("[live-data] AtCoder refresh failed:", err.message);
  }
}

async function refreshCodeChef() {
  try {
    const contests = await fetchCodeChefContests();
    db.exec("DELETE FROM events WHERE source = 'CodeChef'");
    const insertStmt = db.prepare(`
      INSERT INTO events (
        id, title, organizer, source, sourceUrl, type, description,
        startDate, endDate, registrationDeadline, location, mode,
        eligibility, teamSizeMin, teamSizeMax, prizePool, tags, skills,
        registrationUrl, status, difficulty, durationMinutes
      ) VALUES (
        @id, @title, @organizer, @source, @sourceUrl, @type, @description,
        @startDate, @endDate, @registrationDeadline, @location, @mode,
        @eligibility, @teamSizeMin, @teamSizeMax, @prizePool, @tags, @skills,
        @registrationUrl, @status, @difficulty, @durationMinutes
      )
    `);
    for (const c of contests) {
      const event = { ...c, id: newId("evt"), type: "CONTEST" };
      event.status = deriveStatus(event);
      insertStmt.run(event);
    }
    console.log(`[live-data] Refreshed ${contests.length} contests from CodeChef`);
  } catch (err) {
    console.error("[live-data] CodeChef refresh failed:", err.message);
  }
}

async function refreshLeetCode() {
  try {
    const contests = await fetchLeetCodeContests();
    db.exec("DELETE FROM events WHERE source = 'LeetCode'");
    const insertStmt = db.prepare(`
      INSERT INTO events (
        id, title, organizer, source, sourceUrl, type, description,
        startDate, endDate, registrationDeadline, location, mode,
        eligibility, teamSizeMin, teamSizeMax, prizePool, tags, skills,
        registrationUrl, status, difficulty, durationMinutes
      ) VALUES (
        @id, @title, @organizer, @source, @sourceUrl, @type, @description,
        @startDate, @endDate, @registrationDeadline, @location, @mode,
        @eligibility, @teamSizeMin, @teamSizeMax, @prizePool, @tags, @skills,
        @registrationUrl, @status, @difficulty, @durationMinutes
      )
    `);
    for (const c of contests) {
      const event = { ...c, id: newId("evt"), type: "CONTEST" };
      event.status = deriveStatus(event);
      insertStmt.run(event);
    }
    console.log(`[live-data] Refreshed ${contests.length} contests from LeetCode`);
  } catch (err) {
    console.error("[live-data] LeetCode refresh failed:", err.message);
  }
}



function startLiveDataRefresh() {
  refreshDevpost();
  refreshUnstop();
  refreshCodeforces();
  refreshAtCoder();
  refreshCodeChef();
  refreshLeetCode();
  setInterval(refreshDevpost, 30 * 60 * 1000);
  setInterval(refreshUnstop, 60 * 60 * 1000);
  setInterval(refreshCodeforces, 15 * 60 * 1000);
  setInterval(refreshAtCoder, 60 * 60 * 1000);
  setInterval(refreshCodeChef, 60 * 60 * 1000);
  setInterval(refreshLeetCode, 60 * 60 * 1000);
}

module.exports = {
  startLiveDataRefresh,
  refreshDevpost,
  refreshUnstop,
  refreshCodeforces,
  refreshAtCoder,
  refreshCodeChef,
  refreshLeetCode,
};

module.exports = { startLiveDataRefresh, refreshDevpost, refreshUnstop, refreshCodeforces };

module.exports = { startLiveDataRefresh, refreshDevpost };