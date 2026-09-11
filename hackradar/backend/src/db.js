const path = require("path");
const fs = require("fs");
const { DatabaseSync } = require("node:sqlite");

// Using Node's built-in SQLite module (stable in Node 22+) instead of
// better-sqlite3. This avoids native compilation entirely, which needs
// Visual Studio C++ build tools on Windows if no prebuilt binary matches
// your exact Node version — a common source of setup pain. Zero npm
// dependency for the database layer now.

const DB_PATH = path.join(__dirname, "..", "dev.db");
const db = new DatabaseSync(DB_PATH);

db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");

const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
db.exec(schema);

module.exports = db;
