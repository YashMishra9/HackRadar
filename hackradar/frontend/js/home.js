async function initHome() {
  const [profile, allHack, closingSoon, cities, contests, savedIds] = await Promise.all([
    apiGet("/profile").catch(() => null),
        apiGet("/events?type=HACKATHON&pageSize=1000"),
    apiGet("/events/closing-soon"),
    apiGet("/locations"),
    apiGet("/events?type=CONTEST&pageSize=5&sort=deadline"),
    getSavedIds(),
  ]);

  if (profile) {
    document.getElementById("greeting").textContent = `Good morning, ${profile.name} \ud83d\udc4b`;
  }

  const openCount = allHack.results.filter((e) => e.status !== "CLOSED").length;
  const closingCount = closingSoon.results.length;
  const topMatchCount = allHack.results.filter((e) => (e.matchScore || 0) >= 80).length;

  document.getElementById("stat-row").innerHTML = `
    <div class="stat-card accent">
      <div class="num">${openCount}</div>
      <div class="label">Open opportunities</div>
    </div>
    <div class="stat-card red">
      <div class="num">${closingCount}</div>
      <div class="label">Closing within 72h</div>
    </div>
    <div class="stat-card">
      <div class="num">${topMatchCount}</div>
      <div class="label">80%+ matches for you</div>
    </div>
  `;

  const closingList = document.getElementById("closing-soon-list");
  if (closingSoon.results.length === 0) {
    closingList.innerHTML = `<div class="empty-state"><h3>Nothing closing soon</h3>All your relevant hackathons still have breathing room.</div>`;
  } else {
    closingList.innerHTML = closingSoon.results
      .slice(0, 4)
      .map(
        (e) => `
        <div class="closing-row">
          <div>
            <div class="closing-row-title"><a href="detail.html?id=${e.id}">${escapeHtml(e.title)}</a></div>
            <div class="closing-row-meta">${modeLabel(e.mode)} \u00b7 ${escapeHtml(e.location)}</div>
          </div>
          <span class="deadline-tag ${formatDeadline(e.registrationDeadline).cls}">${formatDeadline(e.registrationDeadline).text}</span>
        </div>`
      )
      .join("");
  }

  const topMatches = allHack.results
    .filter((e) => e.status !== "CLOSED")
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    .slice(0, 6);
  document.getElementById("top-matches").innerHTML = topMatches.map((e) => hackCardHtml(e, savedIds)).join("");
  wireSaveButtons(document.getElementById("top-matches"));

  document.getElementById("city-list").innerHTML = cities.results
    .slice(0, 8)
    .map(
      (c) => `<div class="city-row"><span>${escapeHtml(c.location)}</span><span class="count">${c.count} opportunit${c.count === 1 ? "y" : "ies"}</span></div>`
    )
    .join("");

  document.getElementById("contest-preview").innerHTML = contests.results
    .map(
      (c) => `
      <div class="contest-row">
        <div>
          <div>${escapeHtml(c.title)}</div>
          <div class="platform">${escapeHtml(c.source)} \u00b7 ${c.difficulty || "Rated"}</div>
        </div>
        <a class="btn small ghost" href="${c.registrationUrl}" target="_blank" rel="noopener">Open</a>
      </div>`
    )
    .join("");
}

initHome().catch((err) => {
  console.error(err);
  document.querySelector(".main").innerHTML = `<div class="empty-state"><h3>Couldn't load dashboard</h3>Check that the backend server is running.</div>`;
});
