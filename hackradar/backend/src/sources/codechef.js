const CC_API = "https://www.codechef.com/api/list/contests/all";

async function fetchCodeChefContests() {
  const res = await fetch(CC_API);
  if (!res.ok) throw new Error(`CodeChef API returned ${res.status}`);
  const data = await res.json();
  if (data.status !== "success") throw new Error("CodeChef API status not success");

  const upcoming = [...(data.present_contests || []), ...(data.future_contests || [])];

  return upcoming.map((c) => {
    const start = new Date(c.contest_start_date_iso);
    const end = new Date(c.contest_end_date_iso);
    return {
      title: c.contest_name,
      organizer: "CodeChef",
      source: "CodeChef",
      sourceUrl: `https://www.codechef.com/${c.contest_code}`,
      description: `${c.contest_name} — a CodeChef contest.`,
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
      registrationUrl: `https://www.codechef.com/${c.contest_code}`,
      difficulty: /div\s*4|starter/i.test(c.contest_name) ? "Beginner" : null,
      durationMinutes: parseInt(c.contest_duration, 10) || null,
    };
  });
}

module.exports = { fetchCodeChefContests };