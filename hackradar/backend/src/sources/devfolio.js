const puppeteer = require("puppeteer");

async function fetchDevfolioHackathons({ debug = false } = {}) {
  const browser = await puppeteer.launch({ headless: "new" });
  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    );
    await page.goto("https://devfolio.co/hackathons/open", { waitUntil: "networkidle2", timeout: 30000 });
    await new Promise((r) => setTimeout(r, 2000));

    const nextData = await page.evaluate(() => {
      const el = document.getElementById("__NEXT_DATA__");
      return el ? JSON.parse(el.textContent) : null;
    });

    if (debug) {
      const fs = require("fs");
      fs.writeFileSync("devfolio-debug.html", await page.content());
      fs.writeFileSync("devfolio-debug-nextdata.json", JSON.stringify(nextData, null, 2));
      console.log("[devfolio] Wrote devfolio-debug.html and devfolio-debug-nextdata.json");
    }

    if (!nextData) {
      console.log("[devfolio] No embedded data found on the page.");
      return [];
    }

    console.log("[devfolio] Found embedded page data — check devfolio-debug-nextdata.json");
    return [];
  } finally {
    await browser.close();
  }
}

module.exports = { fetchDevfolioHackathons };