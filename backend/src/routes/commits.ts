import { Router } from "express";
import { getCommits, parseRepositoryUrl } from "../integrations/github.js";

const router = Router();

router.get("/", async (req, res) => {
    try {
        const { owner, repository } = parseRepositoryUrl(req.query.url);
        const commits = await getCommits(owner, repository);

        return res.status(200).json(
            commits.map((item) => ({
                sha: item.sha,
                message: item.commit.message,
                author: {
                    name: item.commit.author?.name,
                    login: item.author?.login ?? null,
                    avatar: item.author?.avatar_url ?? null
                },
                date: item.commit.author?.date,
                url: item.html_url
            }))
        );
    } catch (error) {
        return res.status(400).json({
            error: error instanceof Error ? error.message : "Erro inesperado."
        });
    }
});

export default router;