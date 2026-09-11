const CF_API = "https://codeforces.com/api/contest.list?gym=false";

function difficultyFromName(name) {
  if (/div\.\s*1/i.test(name)) return "Advanced";
  if (/div\.\s*2/i.test(name)) return "Intermediate";
  if (/div\.\s*3|div\.\s*4|educational/i.test(name)) return "Beginner";
  return null;
}

async function fetchCodeforcesContests() {
  const res = await fetch(CF_API);
  if (!res.ok) throw new Error(`Codeforces API returned ${res.status}`);
  const data = await res.json();
  if (data.status !== "OK") throw new Error("Codeforces API status not OK");

  const upcoming = data.result.filter((c) => c.phase === "BEFORE");

  return upcoming.map((c) => {
    const start = new Date(c.startTimeSeconds * 1000);
    const end = new Date((c.startTimeSeconds + c.durationSeconds) * 1000);
    return {
      title: c.name,
      organizer: "Codeforces",
      source: "Codeforces",
      sourceUrl: `https://codeforces.com/contests/${c.id}`,
      description: `${c.name} — a rated Codeforces round. Registration stays open right up until the contest starts.`,
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
      registrationUrl: `https://codeforces.com/contests/${c.id}`,
      difficulty: difficultyFromName(c.name),
      durationMinutes: Math.round(c.durationSeconds / 60),
    };
  });
}

module.exports = { fetchCodeforcesContests };