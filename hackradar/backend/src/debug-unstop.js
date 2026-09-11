const { fetchUnstopHackathons } = require("./sources/unstop");
fetchUnstopHackathons({ debug: true }).then(() => process.exit(0));