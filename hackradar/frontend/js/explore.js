const ALL_TAGS = [
  "AI/ML",
  "Web Development",
  "Blockchain/Web3",
  "FinTech",
  "Healthcare",
  "Cybersecurity",
  "Open Innovation",
  "Beginner Friendly",
  "College Students",
];

function renderTagFilters() {
  const container = document.getElementById("filter-tags");
  container.innerHTML = ALL_TAGS.map(
    (tag) => `<label class="filter-chip"><input type="radio" name="tag" value="${tag}" /> ${tag}</label>`
  ).join("");
  container.insertAdjacentHTML(
    "afterbegin",
    `<label class="filter-chip"><input type="radio" name="tag" value="" checked /> Any</label>`
  );
}

function getFilters() {
  const mode = document.querySelector('input[name="mode"]:checked').value;
  const status = document.querySelector('input[name="status"]:checked').value;
  const tag = document.querySelector('input[name="tag"]:checked')?.value || "";
  const location = document.getElementById("filter-location").value.trim();
  const search = document.getElementById("search-input").value.trim();
  const sort = document.getElementById("sort-select").value;
  return { mode, status, tag, location, search, sort };
}

function buildQuery(filters) {
  const params = new URLSearchParams({ type: "HACKATHON", pageSize: "1000", sort: filters.sort });
  if (filters.mode) params.set("mode", filters.mode);
  if (filters.status) params.set("status", filters.status);
  if (filters.tag) params.set("tag", filters.tag);
  if (filters.location) params.set("location", filters.location);
  if (filters.search) params.set("search", filters.search);
  return params.toString();
}

let debounceTimer = null;

async function runSearch() {
  const filters = getFilters();
  const [data, savedIds] = await Promise.all([apiGet(`/events?${buildQuery(filters)}`), getSavedIds()]);

  document.getElementById("result-count").textContent = `${data.total} hackathon${data.total === 1 ? "" : "s"} found`;

  const resultsEl = document.getElementById("results");
  if (data.results.length === 0) {
    resultsEl.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><h3>No hackathons match those filters</h3>Try widening your search or clearing a filter.</div>`;
    return;
  }
  resultsEl.innerHTML = data.results.map((e) => hackCardHtml(e, savedIds)).join("");
}

function debouncedSearch() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(runSearch, 250);
}

function init() {
  renderTagFilters();
  document.getElementById("search-input").addEventListener("input", debouncedSearch);
  document.getElementById("filter-location").addEventListener("input", debouncedSearch);
  document.getElementById("sort-select").addEventListener("change", runSearch);
  document.querySelectorAll('input[name="mode"], input[name="status"]').forEach((el) =>
    el.addEventListener("change", runSearch)
  );
  document.getElementById("filter-tags").addEventListener("change", runSearch);
  wireSaveButtons(document.getElementById("results"));
  runSearch().catch((err) => {
    console.error(err);
    document.getElementById("results").innerHTML = `<div class="empty-state" style="grid-column:1/-1"><h3>Couldn't load results</h3>Check that the backend server is running.</div>`;
  });
}

init();
