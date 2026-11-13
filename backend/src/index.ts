import express from "express";
import repositoriesRouter from "./routes/repositories.js";
import commitsRouter from "./routes/commits.js";
import releasesRouter from "./routes/releases.js";
import pullRequestsRouter from "./routes/pullRequests.js";
import contributorsRouter from "./routes/contributors.js";
import timelineRouter from "./routes/timeline.js";
import historyRouter from "./routes/history.js";
import milestonesRouter from "./routes/milestones.js";
import cors from "cors";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use("/api/releases", releasesRouter);
app.use("/api/pull-requests", pullRequestsRouter);
app.use("/api/contributors", contributorsRouter);
app.use("/api/timeline", timelineRouter);
app.use("/api/history", historyRouter);
app.use("/api/milestones", milestonesRouter);

app.get("/api/health", (req, res) => {
    return res.status(200).json({
        status: "online",
        project: "RASTRO"
    });
});

app.use("/api/repositories", repositoriesRouter);
app.use("/api/commits", commitsRouter);

app.listen(PORT, () => {
    console.log(`RASTRO API running at http://localhost:${PORT}`);
});