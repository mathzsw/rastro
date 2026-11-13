import { Router } from "express";
import { getPullRequests, parseRepositoryUrl } from "../integrations/github.js";

const router = Router();

router.get("/", async (req, res) => {
    try {
        const { owner, repository } = parseRepositoryUrl(req.query.url);
        const pullRequests = await getPullRequests(owner, repository);

        return res.status(200).json(
            pullRequests.map((item) => ({
                id: item.id,
                number: item.number,
                title: item.title,
                description: item.body,
                state: item.state,
                createdAt: item.created_at,
                updatedAt: item.updated_at,
                closedAt: item.closed_at,
                mergedAt: item.merged_at,
                url: item.html_url,
                author: item.user?.login ?? null,
                avatar: item.user?.avatar_url ?? null
            }))
        );
    } catch (error) {
        return res.status(400).json({
            error: error instanceof Error ? error.message : "Erro inesperado."
        });
    }
});

export default router;