const puppeteer = require("puppeteer");

function parseTeamSize(text) {
  if (!text) return { min: null, max: null };
  if (/individual/i.test(text)) return { min: 1, max: 1 };
  const m = text.match(/(\d+)\s*-\s*(\d+)/);
  if (m) return { min: parseInt(m[1], 10), max: parseInt(m[2], 10) };
  return { min: null, max: null };
}

function parseDeadline(text) {
  if (!text) return null;
  const m = text.match(/(\d+)\s*days?\s*left/i);
  if (!m) return null;
  const days = parseInt(m[1], 10);
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function parsePrize(text) {
  if (!text) return null;
  const m = text.replace(/,/g, "").match(/(\d{3,})/);
  return m ? parseInt(m[1], 10) : null;
}

function extractCards() {
  const cards = Array.from(document.querySelectorAll('a.item[href^="/hackathons/"]'));
  return cards.map((card) => {
    const title = card.querySelector("h3, h2")?.innerText?.trim() || "";
    const organizer = card.querySelector("p.single-wrap")?.innerText?.trim() || "";
    const location = card.querySelector(".location_text")?.innerText?.trim() || "";
    const href = card.getAttribute("href");
    const img = card.querySelector(".logo img")?.getAttribute("src") || null;

    let teamSizeText = "";
    Array.from(card.querySelectorAll(".other_fields > div")).forEach((div) => {
      const t = div.innerText.trim();
      if (t.includes("Member") || t.includes("Individual")) teamSizeText = t;
    });

    let deadlineText = "";
    Array.from(card.querySelectorAll(".un_tag .tag-text")).forEach((l) => {
      const t = l.innerText.trim();
      if (t.includes("left")) deadlineText = t;
    });

    const prizeText = card.querySelector(".cash_widget .title")?.innerText?.trim() || "";

    // Category/theme chips shown on every card (e.g. "Software Development",
    // "Artificial Intelligence", "Engineering Students") — every hackathon
    // has these regardless of which category it's actually filed under.
    const themeTexts = Array.from(card.querySelectorAll(".skill_list .chip_text"))
      .map((el) => el.innerText.trim())
      .filter(Boolean);

    return { title, organizer, location, href, img, teamSizeText, deadlineText, prizeText, themeTexts };
  });
}

// Unstop paginates with numbered page buttons (1, 2, 3...) driven by a
// click handler, not a URL param and not infinite scroll. Click "next"
// repeatedly and collect cards after each click until the arrow disables
// or the list stops changing.
async function scrapeWithPagination(page, status, { maxPages = 40 } = {}) {
  await page.goto(`https://unstop.com/hackathons?oppstatus=${status}`, {
    waitUntil: "networkidle2",
    timeout: 45000,
  });
  await new Promise((r) => setTimeout(r, 2500));

  const collected = new Map();

  for (let i = 0; i < maxPages; i++) {
    const cards = await page.evaluate(extractCards);
    for (const c of cards) if (c.href) collected.set(c.href, c);

    const clicked = await page.evaluate(() => {
      const nextLi = document.querySelector("app-pagination li.right-arrow.num.arrow");
      if (!nextLi || nextLi.classList.contains("disabled")) return false;
      const span = nextLi.querySelector("span");
      if (!span) return false;
      span.click();
      return true;
    });

    if (!clicked) break;
    await new Promise((r) => setTimeout(r, 2000));
  }

  return Array.from(collected.values());
}

async function fetchUnstopHackathons() {
    const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--single-process",
    ],
  });
  const seen = new Map();
  try {
        const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    );
    await page.setViewport({ width: 1280, height: 2000 });

    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const type = req.resourceType();
      if (["image", "font", "stylesheet", "media"].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    for (const status of ["open", "upcoming"]) {
      const cards = await scrapeWithPagination(page, status);
      console.log(`[unstop] Collected ${cards.length} cards for status=${status}`);
      for (const c of cards) {
        if (!c.href || seen.has(c.href)) continue;
        seen.set(c.href, c);
      }
    }
  } finally {
    await browser.close();
  }

    const withDeadlines = Array.from(seen.values())
    .map((c) => ({ ...c, parsedDeadline: parseDeadline(c.deadlineText) }))
    .filter((c) => c.parsedDeadline); // no real countdown on the card = likely stale/closed; drop it

  console.log(`[unstop] Dropped ${seen.size - withDeadlines.length} cards with no parseable deadline (likely stale)`);

  return withDeadlines.map((c) => {
    const { min, max } = parseTeamSize(c.teamSizeText);
    const deadline = c.parsedDeadline;
    const isOnline = /online/i.test(c.location);
    return {
      title: c.title,
      organizer: c.organizer || "Unstop",
      source: "Unstop",
      sourceUrl: `https://unstop.com${c.href}`,
      description: `${c.title}, hosted by ${c.organizer || "Unstop"}. See the Unstop listing for full eligibility, themes, and rules.`,
      imageUrl: c.img,
      startDate: deadline || new Date().toISOString(),
      endDate: deadline || new Date().toISOString(),
      registrationDeadline: deadline,
      location: c.location || "Online",
      mode: isOnline ? "ONLINE" : "OFFLINE",
      eligibility: "See Unstop listing for full eligibility",
      teamSizeMin: min,
      teamSizeMax: max,
      prizePool: parsePrize(c.prizeText),
      prizeCurrency: "₹",
      tags: (c.themeTexts || []).join(","),
      skills: "",
      registrationUrl: `https://unstop.com${c.href}`,
    };
  });
}

module.exports = { fetchUnstopHackathons };