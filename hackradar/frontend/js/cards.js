function hackCardHtml(event, savedIds) {
  const deadline = formatDeadline(event.registrationDeadline);
  const isSaved = savedIds && savedIds.has(event.id);
  const prize = formatPrize(event.prizePool, event.prizeCurrency);
  const statusClass = `status-${(event.status || "").toLowerCase()}`;

  return `
    <article class="hack-card ${statusClass}" data-event-id="${event.id}">
      <div class="hack-card-top">
        <div>
          <div class="hack-card-title"><a href="detail.html?id=${event.id}">${escapeHtml(event.title)}</a></div>
          <div class="hack-card-org">${escapeHtml(event.organizer)} \u00b7 ${escapeHtml(event.source)}${event.source === "Devpost" ? ' <span class="live-badge">LIVE</span>' : ""}</div>
        </div>
        ${event.matchScore != null ? `<div class="match-badge">${event.matchScore}% match</div>` : ""}
      </div>

      <div class="hack-card-meta">
        <span class="pill mode-${event.mode.toLowerCase()}">${modeLabel(event.mode)}</span>
        <span class="pill">${escapeHtml(event.location)}</span>
        <span class="pill">${teamSizeLabel(event.teamSizeMin, event.teamSizeMax)}</span>
        ${prize ? `<span class="pill">${prize} prize pool</span>` : ""}
      </div>

      ${event.matchExplanation ? `<div class="hack-card-explain">${escapeHtml(event.matchExplanation)}</div>` : ""}

      <div class="hack-card-bottom">
        <span class="deadline-tag ${deadline.cls}">${deadline.text}</span>
        <div class="card-actions">
          <button class="btn small save ${isSaved ? "saved" : ""}" data-save-id="${event.id}">
            ${isSaved ? "\u2665 Saved" : "\u2661 Save"}
          </button>
          <a class="btn small primary" href="detail.html?id=${event.id}">View</a>
        </div>
      </div>
    </article>
  `;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

// Delegated click handler for save buttons — call once per page after cards render.
function wireSaveButtons(container, onToggle) {
  container.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-save-id]");
    if (!btn) return;
    const id = btn.getAttribute("data-save-id");
    const nowSaved = !btn.classList.contains("saved");
    btn.disabled = true;
    try {
      if (nowSaved) {
        await apiPost(`/saved/${id}`);
      } else {
        await apiDelete(`/saved/${id}`);
      }
      invalidateSavedCache();
      btn.classList.toggle("saved", nowSaved);
      btn.innerHTML = nowSaved ? "\u2665 Saved" : "\u2661 Save";
      if (onToggle) onToggle(id, nowSaved);
    } catch (err) {
      console.error(err);
    } finally {
      btn.disabled = false;
    }
  });
}
