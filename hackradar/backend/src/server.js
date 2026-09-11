const express = require("express");
const { startLiveDataRefresh } = require("./refreshLiveData");
const cors = require("cors");
const path = require("path");
const eventsRouter = require("./routes");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/api", eventsRouter);

app.get("/api/health", (req, res) => res.json({ ok: true }));

// Serve the frontend as static files too, so `npm run dev` alone is enough
// to see the whole app at http://localhost:4000
const frontendPath = path.join(__dirname, "..", "..", "frontend");
app.use(express.static(frontendPath));

startLiveDataRefresh();

app.listen(PORT, () => {
  console.log(`HackRadar API + frontend running at http://localhost:${PORT}`);
});
