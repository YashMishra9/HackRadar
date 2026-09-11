const LC_GRAPHQL = "https://leetcode.com/graphql/";

const QUERY = `
  query {
    allContests {
      title
      titleSlug
      startTime
      duration
    }
  }
`;

async function fetchLeetCodeContests() {
  const res = await fetch(LC_GRAPHQL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: QUERY }),
  });
  if (!res.ok) throw new Error(`LeetCode GraphQL returned ${res.status}`);
  const json = await res.json();
  const contests = json?.data?.allContests || [];

  const now = Date.now() / 1000;
  const upcoming = contests.filter((c) => c.startTime > now);

  return upcoming.map((c) => {
    const start = new Date(c.startTime * 1000);
    const end = new Date((c.startTime + c.duration) * 1000);
    return {
      title: c.title,
      organizer: "LeetCode",
      source: "LeetCode",
      sourceUrl: `https://leetcode.com/contest/${c.titleSlug}`,
      description: `${c.title} — a rated LeetCode contest.`,
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
      skills: "Python,DSA",
      registrationUrl: `https://leetcode.com/contest/${c.titleSlug}`,
      difficulty: /biweekly/i.test(c.title) ? "Intermediate" : "Beginner",
      durationMinutes: Math.round(c.duration / 60),
    };
  });
}

module.exports = { fetchLeetCodeContests };