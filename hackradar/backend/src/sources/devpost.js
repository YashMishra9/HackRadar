const DEVPOST_API = "https://devpost.com/api/hackathons?status[]=open&per_page=50";

// Devpost gives relative urgency text ("21 days left", "about 1 month left")
// instead of an exact deadline — parse it into an actual Date.
function parseTimeLeft(text) {
  if (!text) return null;
  const m = text.match(/(\d+)\s+(hour|day|month)s?\s+left/i);
  if (!m) return null;
  const [, num, unit] = m;
  const hoursPerUnit = { hour: 1, day: 24, month: 24 * 30 };
  const ms = parseInt(num, 10) * hoursPerUnit[unit.toLowerCase()] * 60 * 60 * 1000;
  return new Date(Date.now() + ms).toISOString();
}

// "Jul 31 - Oct 01, 2026" / "Sep 01 - 10, 2026" / "Jul 16, 2026 - Jan 15, 2027"
function parseDateRange(text) {
  if (!text) return { start: null, end: null };
  const now = new Date();
  const parts = text.split(" - ").map((s) => s.trim());
  let endStr = parts[parts.length - 1];
  if (!/\d{4}/.test(endStr)) endStr += `, ${now.getFullYear()}`;
  const end = new Date(endStr);

  let startStr = parts[0];
  if (!/\d{4}/.test(startStr)) startStr += `, ${end.getFullYear()}`;
  const start = new Date(startStr);

  return {
    start: isNaN(start) ? null : start.toISOString(),
    end: isNaN(end) ? null : end.toISOString(),
  };
}

function parsePrize(html) {
  if (!html) return { amount: null, currency: "$" };
  const match = html.match(/data-currency-value>([\d,]+)</);
  const amount = match ? parseInt(match[1].replace(/,/g, ""), 10) : null;
  const currencyMatch = html.match(/^([^\d<]+)/); // symbol before the number/tag
  const currency = currencyMatch ? currencyMatch[1].trim() : "$";
  return { amount: amount || null, currency: currency || "$" };
}

async function fetchDevpostHackathons() {
  const res = await fetch(DEVPOST_API);
  if (!res.ok) throw new Error(`Devpost API returned ${res.status}`);
  const data = await res.json();

  return data.hackathons.map((h) => {
    const { start, end } = parseDateRange(h.submission_period_dates);
    const prize = parsePrize(h.prize_amount);
    return {
      title: h.title.trim(),
      organizer: h.organization_name || "Devpost",
      source: "Devpost",
      sourceUrl: h.url,
      description: `${h.title} — themes: ${(h.themes || []).map((t) => t.name).join(", ") || "Open theme"}. ${h.registrations_count || 0} registered so far.`,
      imageUrl: h.thumbnail_url ? (h.thumbnail_url.startsWith("http") ? h.thumbnail_url : `https:${h.thumbnail_url}`) : null,
      startDate: start || new Date().toISOString(),
      endDate: end || new Date().toISOString(),
      registrationDeadline: parseTimeLeft(h.time_left_to_submission) || end,
      location: h.displayed_location?.location || "Online",
      mode: h.displayed_location?.location === "Online" ? "ONLINE" : "OFFLINE",
      eligibility: "Open to all (see hackathon page for specifics)",
      teamSizeMin: null,
      teamSizeMax: null,
      prizePool: prize.amount,
      prizeCurrency: prize.currency,
      tags: (h.themes || []).map((t) => t.name).join(","),
      skills: "",
      registrationUrl: h.url,
    };
  });
}

module.exports = { fetchDevpostHackathons };