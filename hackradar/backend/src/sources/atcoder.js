const AC_API = "https://kenkoooo.com/atcoder/resources/contests.json";

function difficultyFromRange(range) {
  if (!range || range === "-") return null;
  if (range.includes("~ 1999") || range.includes("~ 1199")) return "Beginner";
  if (range.includes("1200") || range.includes("2799")) return "Intermediate";
  return "Advanced";
}

async function fetchAtCoderContests() {
  const res = await fetch(AC_API);
  if (!res.ok) throw new Error(`AtCoder feed returned ${res.status}`);
  const data = await res.json();

  const now = Date.now();
  const upcoming = data.filter((c) => c.start_epoch_second * 1000 > now);

  return upcoming.map((c) => {
    const start = new Date(c.start_epoch_second * 1000);
    const end = new Date((c.start_epoch_second + c.duration_second) * 1000);
    return {
      title: c.title,
      organizer: "AtCoder",
      source: "AtCoder",
      sourceUrl: `https://atcoder.jp/contests/${c.id}`,
      description: `${c.title} — a rated AtCoder contest.`,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      registrationDeadline: start.toISOString(),
      location: "Online",
      mode: "ONLINE",
      eligibility: "Open to all, individual",
      teamSizeMin: 1,
      teamSizeMax: 1,
      prizePool: null,
      tags: "Competitive Programming",
      skills: "C++,DSA",
      registrationUrl: `https://atcoder.jp/contests/${c.id}`,
      difficulty: difficultyFromRange(c.rate_change),
      durationMinutes: Math.round(c.duration_second / 60),
    };
  });
}

module.exports = { fetchAtCoderContests };