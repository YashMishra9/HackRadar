const { fetchDevfolioHackathons } = require("./sources/devfolio");
fetchDevfolioHackathons({ debug: true }).then(() => process.exit(0));