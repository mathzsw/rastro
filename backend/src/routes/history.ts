import { Router } from "express";
import {
    getRepository,
    getCommits,
    getReleases,
    getPullRequests,
    parseRepositoryUrl
} from "../integrations/github.js";

import { buildHistory } from "../services/history.js";

const router = Router();

router.get("/", async (req, res) => {
    try {
        const { owner, repository } = parseRepositoryUrl(req.query.url);

        const [repo, commits, releases, pullRequests] = await Promise.all([
            getRepository(owner, repository),
            getCommits(owner, repository),
            getReleases(owner, repository),
            getPullRequests(owner, repository)
        ]);

        return res.status(200).json(
            buildHistory(repo, commits, releases, pullRequests)
        );
    } catch (error) {
        return res.status(400).json({
            error: error instanceof Error ? error.message : "Erro inesperado."
        });
    }
});

export default router;