const crypto = require("crypto");

function newId(prefix) {
  return `${prefix}_${crypto.randomBytes(9).toString("hex")}`;
}

// Derive a live status from the registration deadline, independent of
// whatever was set at seed time. "CLOSING_SOON" = deadline within 48h.
function deriveStatus(event) {
  const now = Date.now();
  const deadline = event.registrationDeadline
    ? new Date(event.registrationDeadline).getTime()
    : null;
  const end = new Date(event.endDate).getTime();

  if (end < now) return "CLOSED";
  if (deadline && deadline < now) return "CLOSED";
  if (deadline && deadline - now <= 48 * 60 * 60 * 1000) return "CLOSING_SOON";
  return "OPEN";
}

function splitCsv(value) {
  if (Array.isArray(value)) return value;
  return (value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function toCsv(arr) {
  return (arr || []).join(",");
}

module.exports = { newId, deriveStatus, splitCsv, toCsv };
